import { ShiftStatus } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { NotFoundError, ForbiddenError } from '../../utils/errors'
import { logger } from '../../utils/logger'
const MAX_SHIFT_HOURS = 12

export interface AvailabilityStatus {
  isOnline: boolean
  currentShift: {
    id: string
    startTime: string
    elapsedMinutes: number
    firstOrderTime: string | null
    workedMinutes: number
  } | null
}

export interface MonthlyHours {
  month: string // YYYY-MM format
  year: number
  monthNumber: number
  monthName: string
  totalMinutes: number
  totalHours: number
  shiftCount: number
}

export interface MonthlyHoursResponse {
  months: MonthlyHours[]
  totalMinutes: number
  totalHours: number
}


async function getLastWorkTime(driverId: string, shiftStart: Date, shiftEnd: Date): Promise<Date | null> {

  const lastDelivered = await prisma.order.findFirst({
    where: {
      driverId,
      deliveredAt: {
        gte: shiftStart,
        lte: shiftEnd,
      },
      status: 'DELIVERED',
    },
    orderBy: { deliveredAt: 'desc' },
    select: { deliveredAt: true },
  })

  const lastCancelled = await prisma.order.findFirst({
    where: {
      driverId,
      updatedAt: {
        gte: shiftStart,
        lte: shiftEnd,
      },
      status: 'CANCELLED',
    },
    orderBy: { updatedAt: 'desc' },
    select: { updatedAt: true },
  })

  // Find the last in-progress order (any status that's not DELIVERED/CANCELLED)
  // This handles cases where driver goes offline while order is still being worked on
  const lastInProgress = await prisma.order.findFirst({
    where: {
      driverId,
      updatedAt: {
        gte: shiftStart,
        lte: shiftEnd,
      },
      status: {
        notIn: ['DELIVERED', 'CANCELLED'],
      },
    },
    orderBy: { updatedAt: 'desc' },
    select: { updatedAt: true },
  })

  const times = [
    lastDelivered?.deliveredAt,
    lastCancelled?.updatedAt,
    lastInProgress?.updatedAt,
  ].filter((t): t is Date => t !== null && t !== undefined)

  let lastWorkTime: Date | null = null
  if (times.length > 0) {
    lastWorkTime = times.reduce((latest, current) => current > latest ? current : latest)
  }


  return lastWorkTime
}

async function hadOrdersDuringShift(driverId: string, shiftStart: Date, shiftEnd: Date): Promise<boolean> {
  const orderCount = await prisma.order.count({
    where: {
      driverId,
      OR: [
        {
          deliveredAt: {
            gte: shiftStart,
            lte: shiftEnd,
          },
        },
        {
          updatedAt: {
            gte: shiftStart,
            lte: shiftEnd,
          },
        },
      ],
    },
  })
  return orderCount > 0
}

function calculateWorkedMinutes(shiftStart: Date, lastWorkTime: Date | null): number {
  if (!lastWorkTime) {
    return 0
  }

  const diffMs = lastWorkTime.getTime() - shiftStart.getTime()

  if (diffMs < 0) {
    logger.warn('lastWorkTime is before shiftStart', {
      shiftStart: shiftStart.toISOString(),
      lastWorkTime: lastWorkTime.toISOString(),
      diffMs,
    })
    return 0
  }

  return Math.max(1, Math.round(diffMs / (1000 * 60)))
}


export async function toggleAvailability(driverId: string): Promise<AvailabilityStatus> {
  const user = await prisma.user.findUnique({
    where: { id: driverId },
    select: { id: true, role: true },
  })

  if (!user) {
    throw new NotFoundError('User not found', 'User does not exist')
  }

  if (user.role !== 'DELIVERY_DRIVER') {
    throw new ForbiddenError('Not a driver', 'Only delivery drivers can toggle availability')
  }

  const activeShift = await prisma.driverShift.findFirst({
    where: {
      driverId,
      status: ShiftStatus.ACTIVE,
    },
  })

  if (activeShift) {
    const requestedEndTime = new Date()
    const lastWorkTime = await getLastWorkTime(
      driverId,
      activeShift.startTime,
      requestedEndTime
    )
    const durationMinutes = calculateWorkedMinutes(activeShift.startTime, lastWorkTime)
    const actualEndTime = lastWorkTime || requestedEndTime

    logger.info('Shift ended', {
      shiftId: activeShift.id,
      driverId,
      shiftStartTime: activeShift.startTime,
      requestedEndTime,
      lastWorkTime,
      actualEndTime,
      durationMinutes,
    })

    await prisma.driverShift.update({
      where: { id: activeShift.id },
      data: {
        endTime: actualEndTime,
        status: ShiftStatus.COMPLETED,
        durationMinutes,
      },
    })

    return {
      isOnline: false,
      currentShift: null,
    }
  } else {
    const newShift = await prisma.driverShift.create({
      data: {
        driverId,
        status: ShiftStatus.ACTIVE,
      },
    })

    return {
      isOnline: true,
      currentShift: {
        id: newShift.id,
        startTime: newShift.startTime.toISOString(),
        elapsedMinutes: 0,
        firstOrderTime: null,
        workedMinutes: 0,
      },
    }
  }
}

export async function getAvailabilityStatus(driverId: string): Promise<AvailabilityStatus> {
  const user = await prisma.user.findUnique({
    where: { id: driverId },
    select: { id: true, role: true },
  })

  if (!user) {
    throw new NotFoundError('User not found', 'User does not exist')
  }

  if (user.role !== 'DELIVERY_DRIVER') {
    throw new ForbiddenError('Not a driver', 'Only delivery drivers can check availability status')
  }

  const activeShift = await prisma.driverShift.findFirst({
    where: {
      driverId,
      status: ShiftStatus.ACTIVE,
    },
  })

  if (!activeShift) {
    return {
      isOnline: false,
      currentShift: null,
    }
  }

  const now = new Date()
  const elapsedMinutes = Math.round(
    (now.getTime() - activeShift.startTime.getTime()) / (1000 * 60)
  )

  const hasOrders = await hadOrdersDuringShift(
    driverId,
    activeShift.startTime,
    now
  )
  const workedMinutes = hasOrders ? elapsedMinutes : 0

  return {
    isOnline: true,
    currentShift: {
      id: activeShift.id,
      startTime: activeShift.startTime.toISOString(),
      elapsedMinutes,
      firstOrderTime: hasOrders ? activeShift.startTime.toISOString() : null,
      workedMinutes,
    },
  }
}

export async function getMonthlyHours(
  driverId: string,
  months: number = 6
): Promise<MonthlyHoursResponse> {
  const user = await prisma.user.findUnique({
    where: { id: driverId },
    select: { id: true, role: true },
  })

  if (!user) {
    throw new NotFoundError('User not found', 'User does not exist')
  }

  if (user.role !== 'DELIVERY_DRIVER') {
    throw new ForbiddenError('Not a driver', 'Only delivery drivers can view hours')
  }

  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)
  const shifts = await prisma.driverShift.findMany({
    where: {
      driverId,
      status: { in: [ShiftStatus.COMPLETED, ShiftStatus.AUTO_CLOSED] },
      startTime: { gte: startDate },
      durationMinutes: { not: null },
    },
    select: {
      startTime: true,
      durationMinutes: true,
    },
    orderBy: { startTime: 'desc' },
  })

  const monthlyMap = new Map<string, { minutes: number; count: number }>()
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]

  for (let i = 0; i < months; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    monthlyMap.set(key, { minutes: 0, count: 0 })
  }

  for (const shift of shifts) {
    const date = shift.startTime
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const existing = monthlyMap.get(key)
    if (existing) {
      existing.minutes += shift.durationMinutes || 0
      existing.count += 1
    }
  }

  const monthlyHours: MonthlyHours[] = []
  let totalMinutes = 0

  for (let i = 0; i < months; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const data = monthlyMap.get(key) || { minutes: 0, count: 0 }

    monthlyHours.push({
      month: key,
      year: date.getFullYear(),
      monthNumber: date.getMonth() + 1,
      monthName: monthNames[date.getMonth()],
      totalMinutes: data.minutes,
      totalHours: Math.round((data.minutes / 60) * 100) / 100,
      shiftCount: data.count,
    })

    totalMinutes += data.minutes
  }

  return {
    months: monthlyHours,
    totalMinutes,
    totalHours: Math.round((totalMinutes / 60) * 100) / 100,
  }
}

export async function closeStaleShifts(): Promise<number> {
  const cutoffTime = new Date(Date.now() - MAX_SHIFT_HOURS * 60 * 60 * 1000)

  const staleShifts = await prisma.driverShift.findMany({
    where: {
      status: ShiftStatus.ACTIVE,
      startTime: { lt: cutoffTime },
    },
  })

  if (staleShifts.length === 0) {
    return 0
  }

  const closePromises = staleShifts.map(async (shift) => {
    const maxEndTime = new Date(shift.startTime.getTime() + MAX_SHIFT_HOURS * 60 * 60 * 1000)
    const lastWorkTime = await getLastWorkTime(
      shift.driverId,
      shift.startTime,
      maxEndTime
    )

    const durationMinutes = calculateWorkedMinutes(shift.startTime, lastWorkTime)
    const actualEndTime = lastWorkTime || maxEndTime
    let reason: string

    if (lastWorkTime) {
      reason = `Auto-closed after ${MAX_SHIFT_HOURS}h: last activity at ${lastWorkTime.toISOString()}`
    } else {
      reason = `Auto-closed after ${MAX_SHIFT_HOURS}h: no orders during shift`
    }

    await prisma.driverShift.update({
      where: { id: shift.id },
      data: {
        endTime: actualEndTime,
        status: ShiftStatus.AUTO_CLOSED,
        durationMinutes,
        autoCloseReason: reason,
      },
    })

    logger.info('Auto-closed stale shift', {
      shiftId: shift.id,
      driverId: shift.driverId,
      shiftStartTime: shift.startTime,
      lastWorkTime,
      actualEndTime,
      durationMinutes,
      reason,
    })
  })

  await Promise.all(closePromises)

  return staleShifts.length
}
