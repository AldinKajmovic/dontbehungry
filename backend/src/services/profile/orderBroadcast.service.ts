import { prisma } from '../../lib/prisma'
import { emitToUser } from '../../socket'
import { haversineDistance } from '../../utils/geo'
import { logger } from '../../utils/logger'

const BROADCAST_RADIUS_KM = 10

const AVAILABLE_ORDER_SELECT = {
  id: true,
  totalAmount: true,
  createdAt: true,
  restaurant: {
    select: {
      name: true,
      place: {
        select: {
          address: true,
          city: true,
          latitude: true,
          longitude: true,
        },
      },
    },
  },
  deliveryPlace: {
    select: {
      address: true,
      city: true,
      latitude: true,
      longitude: true,
    },
  },
  orderItems: {
    select: { id: true },
  },
} as const

interface AvailableOrderItem {
  orderId: string
  restaurantName: string
  restaurantAddress: string
  deliveryAddress: string
  totalAmount: string
  itemCount: number
  createdAt: string
  estimatedDistance: number | null
}

export async function broadcastOrderToNearbyDrivers(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: AVAILABLE_ORDER_SELECT,
  })

  if (!order) {
    logger.warn('broadcastOrderToNearbyDrivers: order not found', { orderId })
    return
  }

  const restaurantLat = order.restaurant.place.latitude
    ? Number(order.restaurant.place.latitude)
    : null
  const restaurantLng = order.restaurant.place.longitude
    ? Number(order.restaurant.place.longitude)
    : null

  if (restaurantLat === null || restaurantLng === null) {
    logger.warn('broadcastOrderToNearbyDrivers: restaurant has no coordinates, skipping', {
      orderId,
    })
    return
  }

  const activeDrivers = await prisma.driverShift.findMany({
    where: { status: 'ACTIVE' },
    select: {
      driverId: true,
      driver: {
        select: {
          driverLocation: {
            select: {
              latitude: true,
              longitude: true,
            },
          },
        },
      },
    },
  })

  const deliveryLat = order.deliveryPlace.latitude
    ? Number(order.deliveryPlace.latitude)
    : null
  const deliveryLng = order.deliveryPlace.longitude
    ? Number(order.deliveryPlace.longitude)
    : null

  const payload: AvailableOrderItem = {
    orderId: order.id,
    restaurantName: order.restaurant.name,
    restaurantAddress: `${order.restaurant.place.address}, ${order.restaurant.place.city}`,
    deliveryAddress: `${order.deliveryPlace.address}, ${order.deliveryPlace.city}`,
    totalAmount: order.totalAmount.toString(),
    itemCount: order.orderItems.length,
    createdAt: order.createdAt.toISOString(),
    estimatedDistance: null,
  }

  let broadcastCount = 0

  for (const shift of activeDrivers) {
    const location = shift.driver.driverLocation
    if (!location) continue

    const driverLat = Number(location.latitude)
    const driverLng = Number(location.longitude)
    const distance = haversineDistance(driverLat, driverLng, restaurantLat, restaurantLng)

    if (distance <= BROADCAST_RADIUS_KM) {
      let estimatedDistance: number | null = null
      if (deliveryLat !== null && deliveryLng !== null) {
        estimatedDistance = Math.round(
          haversineDistance(restaurantLat, restaurantLng, deliveryLat, deliveryLng) * 10
        ) / 10
      }

      emitToUser(shift.driverId, 'order:available', {
        ...payload,
        estimatedDistance,
      })
      broadcastCount++
    }
  }

  logger.info('Order broadcast complete', { orderId, broadcastCount })
}

export async function acceptOrder(
  orderId: string,
  driverId: string
): Promise<{ success: boolean; message: string }> {
  const txResult = await prisma.$transaction(async (tx) => {
    // Check if driver has an active order
    const activeOrder = await tx.order.findFirst({
      where: {
        driverId,
        status: { notIn: ['DELIVERED', 'CANCELLED'] },
      },
      select: { id: true },
    })

    if (activeOrder) {
      return { success: false as const, message: 'You already have an active order' }
    }

    // Prisma limitation, one order per driver
    const result = await tx.order.updateMany({
      where: {
        id: orderId,
        driverId: null,
        status: 'PENDING',
      },
      data: {
        driverId,
      },
    })

    if (result.count === 0) {
      return { success: false as const, message: 'Order is no longer available' }
    }

    return { success: true as const }
  }, { isolationLevel: 'Serializable' })

  if (!txResult.success) {
    return txResult
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      restaurant: {
        select: {
          name: true,
          ownerId: true,
          place: {
            select: { latitude: true, longitude: true },
          },
        },
      },
      driver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  if (order?.driver) {
    const driverName = `${order.driver.firstName} ${order.driver.lastName}`

    // Notify all nearby drivers that this order was taken
    emitToAllOnlineDrivers('order:accepted', {
      orderId,
      driverName,
    })

    // Notify the customer
    emitToUser(order.userId, 'order:accepted', {
      orderId,
      driverName,
    })

    // Notify the restaurant owner
    if (order.restaurant.ownerId) {
      emitToUser(order.restaurant.ownerId, 'order:accepted', {
        orderId,
        driverName,
      })
    }
  }

  return { success: true, message: 'Order accepted successfully' }
}

// If combination of orderId + driverId exists, do nothing(already denied)
export async function denyOrder(orderId: string, driverId: string): Promise<void> {
  await prisma.orderDenial.upsert({
    where: {
      orderId_driverId: { orderId, driverId },
    },
    create: { orderId, driverId },
    update: {},
  })
}

interface PaginatedAvailableOrders {
  orders: AvailableOrderItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export async function getAvailableOrdersForDriver(
  driverId: string,
  page = 1,
  limit = 10
): Promise<PaginatedAvailableOrders> {

  const driverLocation = await prisma.driverLocation.findUnique({
    where: { driverId },
    select: { latitude: true, longitude: true },
  })

  if (!driverLocation) {
    return { orders: [], pagination: { page, limit, total: 0, totalPages: 0 } }
  }

  const driverLat = Number(driverLocation.latitude)
  const driverLng = Number(driverLocation.longitude)

  const deniedOrders = await prisma.orderDenial.findMany({
    where: { driverId },
    select: { orderId: true },
  })
  const deniedOrderIds = deniedOrders.map((d) => d.orderId)

  const pendingOrders = await prisma.order.findMany({
    where: {
      status: 'PENDING',
      driverId: null,
      ...(deniedOrderIds.length > 0 ? { id: { notIn: deniedOrderIds } } : {}),
    },
    select: AVAILABLE_ORDER_SELECT,
    orderBy: { createdAt: 'desc' },
  })

  const availableOrders: AvailableOrderItem[] = []

  for (const order of pendingOrders) {
    const rLat = order.restaurant.place.latitude
      ? Number(order.restaurant.place.latitude)
      : null
    const rLng = order.restaurant.place.longitude
      ? Number(order.restaurant.place.longitude)
      : null

    if (rLat === null || rLng === null) continue

    const distance = haversineDistance(driverLat, driverLng, rLat, rLng)
    if (distance > BROADCAST_RADIUS_KM) continue

    const deliveryLat = order.deliveryPlace.latitude
      ? Number(order.deliveryPlace.latitude)
      : null
    const deliveryLng = order.deliveryPlace.longitude
      ? Number(order.deliveryPlace.longitude)
      : null

    let estimatedDistance: number | null = null
    if (deliveryLat !== null && deliveryLng !== null) {
      estimatedDistance =
        Math.round(haversineDistance(rLat, rLng, deliveryLat, deliveryLng) * 10) / 10
    }

    availableOrders.push({
      orderId: order.id,
      restaurantName: order.restaurant.name,
      restaurantAddress: `${order.restaurant.place.address}, ${order.restaurant.place.city}`,
      deliveryAddress: `${order.deliveryPlace.address}, ${order.deliveryPlace.city}`,
      totalAmount: order.totalAmount.toString(),
      itemCount: order.orderItems.length,
      createdAt: order.createdAt.toISOString(),
      estimatedDistance,
    })
  }

  const total = availableOrders.length
  const totalPages = Math.ceil(total / limit)
  const start = (page - 1) * limit
  const paginatedOrders = availableOrders.slice(start, start + limit)

  return {
    orders: paginatedOrders,
    pagination: { page, limit, total, totalPages },
  }
}

/**
 * Emit `order:removed` to all online drivers.
 * Called when an order is cancelled or admin-assigned.
 */
export async function removeOrderFromDriverQueues(
  orderId: string,
  reason: string = 'unavailable'
): Promise<void> {
  emitToAllOnlineDrivers('order:removed', { orderId, reason })
}


async function emitToAllOnlineDrivers(event: string, data: unknown): Promise<void> {
  const activeShifts = await prisma.driverShift.findMany({
    where: { status: 'ACTIVE' },
    select: { driverId: true },
  })

  for (const shift of activeShifts) {
    emitToUser(shift.driverId, event, data)
  }
}
