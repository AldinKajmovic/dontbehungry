import { ShiftStatus, OrderStatus } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { NotFoundError, ForbiddenError } from '../../utils/errors'
import { emitToUser, emitToAdmins } from '../../socket/socket'

const STALE_THRESHOLD_MINUTES = 2

export interface UpdateLocationData {
  latitude: number
  longitude: number
  heading?: number
}

export interface DriverLocationResponse {
  driverId: string
  driverName: string
  latitude: number
  longitude: number
  heading: number | null
  updatedAt: string
  isStale: boolean
}

export interface LocationUpdateEvent {
  orderId: string
  driverId: string
  driverName: string
  location: {
    latitude: number
    longitude: number
    heading: number | null
  }
  timestamp: string
}

export interface AdminDriverLocationEvent {
  driverId: string
  driverName: string
  location: {
    latitude: number
    longitude: number
    heading: number | null
  }
  timestamp: string
}

export async function updateDriverLocation(
  driverId: string,
  data: UpdateLocationData
): Promise<void> {

  const user = await prisma.user.findUnique({
    where: { id: driverId },
    select: { id: true, role: true, firstName: true, lastName: true },
  })

  if (!user) {
    throw new NotFoundError('User not found', 'User does not exist')
  }

  if (user.role !== 'DELIVERY_DRIVER') {
    throw new ForbiddenError('Not a driver', 'Only delivery drivers can update location')
  }

  const activeShift = await prisma.driverShift.findFirst({
    where: {
      driverId,
      status: ShiftStatus.ACTIVE,
    },
  })

  if (!activeShift) {
    throw new ForbiddenError('Not online', 'You must be online to report location')
  }

  await prisma.driverLocation.upsert({
    where: { driverId },
    update: {
      latitude: data.latitude,
      longitude: data.longitude,
      heading: data.heading ?? null,
    },
    create: {
      driverId,
      latitude: data.latitude,
      longitude: data.longitude,
      heading: data.heading ?? null,
    },
  })

  // Broadcast to customers with active deliveries
  await broadcastLocationToOrderCustomers(driverId, data, user.firstName, user.lastName)

  // Broadcast to all connected admins
  broadcastLocationToAdmins(driverId, data, user.firstName, user.lastName)
}

function broadcastLocationToAdmins(
  driverId: string,
  location: UpdateLocationData,
  driverFirstName: string,
  driverLastName: string
): void {
  const event: AdminDriverLocationEvent = {
    driverId,
    driverName: `${driverFirstName} ${driverLastName}`,
    location: {
      latitude: location.latitude,
      longitude: location.longitude,
      heading: location.heading ?? null,
    },
    timestamp: new Date().toISOString(),
  }

  emitToAdmins('admin:driver:location:update', event)
}

async function broadcastLocationToOrderCustomers(
  driverId: string,
  location: UpdateLocationData,
  driverFirstName: string,
  driverLastName: string
): Promise<void> {

  const activeOrders = await prisma.order.findMany({
    where: {
      driverId,
      status: OrderStatus.OUT_FOR_DELIVERY,
    },
    select: {
      id: true,
      userId: true,
    },
  })

  const driverName = `${driverFirstName} ${driverLastName}`
  const timestamp = new Date().toISOString()

  // Emit location update to each customer
  for (const order of activeOrders) {
    const event: LocationUpdateEvent = {
      orderId: order.id,
      driverId,
      driverName,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        heading: location.heading ?? null,
      },
      timestamp,
    }

    emitToUser(order.userId, 'driver:location:update', event)
  }
}

export async function getDriverLocationForOrder(
  orderId: string,
  userId: string
): Promise<DriverLocationResponse | null> {

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      driverId: true,
      status: true,
      driver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          driverLocation: true,
        },
      },
    },
  })

  if (!order) {
    throw new NotFoundError('Order not found', 'Order does not exist')
  }

  if (order.userId !== userId) {
    throw new ForbiddenError('Access denied', 'You can only track your own orders')
  }

  if (order.status !== OrderStatus.OUT_FOR_DELIVERY) {
    return null
  }

  if (!order.driverId || !order.driver) {
    return null
  }

  if (!order.driver.driverLocation) {
    return null
  }

  const location = order.driver.driverLocation
  const updatedAt = location.updatedAt
  const now = new Date()
  const ageMinutes = (now.getTime() - updatedAt.getTime()) / (1000 * 60)
  const isStale = ageMinutes > STALE_THRESHOLD_MINUTES

  return {
    driverId: order.driver.id,
    driverName: `${order.driver.firstName} ${order.driver.lastName}`,
    latitude: Number(location.latitude),
    longitude: Number(location.longitude),
    heading: location.heading,
    updatedAt: updatedAt.toISOString(),
    isStale,
  }
}
