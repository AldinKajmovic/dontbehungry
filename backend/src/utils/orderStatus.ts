import { BadRequestError } from './errors'

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'

// Valid status transitions state machine
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY_FOR_PICKUP', 'CANCELLED'],
  READY_FOR_PICKUP: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [], // Terminal state
  CANCELLED: [], // Terminal state
}

const ALL_STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
]

export function isValidOrderStatus(status: string): status is OrderStatus {
  return ALL_STATUSES.includes(status as OrderStatus)
}

export function validateStatusTransition(
  currentStatus: string,
  newStatus: string,
  allowAdminOverride = false
): void {
  if (!isValidOrderStatus(currentStatus)) {
    throw new BadRequestError('Invalid current status', `Unknown order status: ${currentStatus}`)
  }

  if (!isValidOrderStatus(newStatus)) {
    throw new BadRequestError('Invalid status', `Unknown order status: ${newStatus}`)
  }

  if (currentStatus === newStatus) {
    return // Same status, no transition needed
  }

  // Admin can force any transition except from terminal states (unless going to same state)
  if (allowAdminOverride) {
    if (currentStatus === 'DELIVERED' || currentStatus === 'CANCELLED') {
      throw new BadRequestError(
        'Invalid status transition',
        `Cannot change status from ${currentStatus} - order is already finalized`
      )
    }
    return
  }

  const allowedTransitions = VALID_TRANSITIONS[currentStatus]

  if (!allowedTransitions.includes(newStatus)) {
    throw new BadRequestError(
      'Invalid status transition',
      `Cannot transition from ${currentStatus} to ${newStatus}. Allowed: ${allowedTransitions.join(', ') || 'none'}`
    )
  }
}

export function getNextValidStatuses(currentStatus: string): OrderStatus[] {
  if (!isValidOrderStatus(currentStatus)) {
    return []
  }
  return VALID_TRANSITIONS[currentStatus]
}
