import { ShiftStatus } from '@prisma/client'
import { prisma } from '../../lib/prisma'

export interface OnlineDriverLocation {
  id: string
  firstName: string
  lastName: string
  phone: string | null
  location: {
    latitude: number
    longitude: number
    heading: number | null
    updatedAt: string
  } | null
  shiftStartTime: string
  activeOrdersCount: number
}

export interface OnlineDriversResponse {
  drivers: OnlineDriverLocation[]
  totalOnline: number
}

export async function getOnlineDriversWithLocations(): Promise<OnlineDriversResponse> {
  const activeShifts = await prisma.driverShift.findMany({
    where: {
      status: ShiftStatus.ACTIVE,
    },
    select: {
      driverId: true,
      startTime: true,
      driver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          driverLocation: {
            select: {
              latitude: true,
              longitude: true,
              heading: true,
              updatedAt: true,
            },
          },
        },
      },
    },
  })

  const driverIds = activeShifts.map(shift => shift.driverId)
  const activeOrdersCounts = await prisma.order.groupBy({
    by: ['driverId'],
    where: {
      driverId: { in: driverIds },
      status: {
        in: ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'],
      },
    },
    _count: {
      id: true,
    },
  })

  const ordersCountMap = new Map(
    activeOrdersCounts.map(item => [item.driverId, item._count.id])
  )

  const drivers: OnlineDriverLocation[] = activeShifts.map(shift => ({
    id: shift.driver.id,
    firstName: shift.driver.firstName,
    lastName: shift.driver.lastName,
    phone: shift.driver.phone,
    location: shift.driver.driverLocation
      ? {
          latitude: Number(shift.driver.driverLocation.latitude),
          longitude: Number(shift.driver.driverLocation.longitude),
          heading: shift.driver.driverLocation.heading,
          updatedAt: shift.driver.driverLocation.updatedAt.toISOString(),
        }
      : null,
    shiftStartTime: shift.startTime.toISOString(),
    activeOrdersCount: ordersCountMap.get(shift.driverId) || 0,
  }))

  return {
    drivers,
    totalOnline: drivers.length,
  }
}
