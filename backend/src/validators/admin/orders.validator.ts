// Order validation: filters, create, update, order items
import { BadRequestError } from '../../utils/errors'

export interface OrderFilters {
  status?: string
  paymentStatus?: string
  restaurantId?: string
  customerId?: string
  driverId?: string
  minTotalAmount?: number
  maxTotalAmount?: number
  createdAtFrom?: Date
  createdAtTo?: Date
}

export function validateOrderFilters(query: {
  status?: string
  paymentStatus?: string
  restaurantId?: string
  customerId?: string
  driverId?: string
  minTotalAmount?: string
  maxTotalAmount?: string
  createdAtFrom?: string
  createdAtTo?: string
}): OrderFilters {
  const filters: OrderFilters = {}

  const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']
  if (query.status && validStatuses.includes(query.status)) {
    filters.status = query.status
  }

  const validPaymentStatuses = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']
  if (query.paymentStatus && validPaymentStatuses.includes(query.paymentStatus)) {
    filters.paymentStatus = query.paymentStatus
  }

  if (query.restaurantId) {
    filters.restaurantId = query.restaurantId
  }

  if (query.customerId) {
    filters.customerId = query.customerId
  }

  if (query.driverId) {
    filters.driverId = query.driverId
  }

  if (query.minTotalAmount) {
    const val = parseFloat(query.minTotalAmount)
    if (!isNaN(val) && val >= 0) filters.minTotalAmount = val
  }

  if (query.maxTotalAmount) {
    const val = parseFloat(query.maxTotalAmount)
    if (!isNaN(val) && val >= 0) filters.maxTotalAmount = val
  }

  if (query.createdAtFrom) {
    const date = new Date(query.createdAtFrom)
    if (!isNaN(date.getTime())) {
      date.setHours(0, 0, 0, 0)
      filters.createdAtFrom = date
    }
  }

  if (query.createdAtTo) {
    const date = new Date(query.createdAtTo)
    if (!isNaN(date.getTime())) {
      date.setHours(23, 59, 59, 999)
      filters.createdAtTo = date
    }
  }

  return filters
}

export interface CreateOrderData {
  userId: string
  restaurantId: string
  deliveryPlaceId: string
  driverId?: string | null
  status?: string
  subtotal: number
  deliveryFee?: number
  tax?: number
  notes?: string | null
}

export function validateCreateOrder(data: CreateOrderData): void {
  const { userId, restaurantId, deliveryPlaceId, subtotal, status } = data

  if (!userId || !restaurantId || !deliveryPlaceId) {
    throw new BadRequestError('Missing required fields', 'userId, restaurantId, and deliveryPlaceId are required')
  }

  if (subtotal === undefined || typeof subtotal !== 'number' || subtotal < 0) {
    throw new BadRequestError('Invalid subtotal', 'Subtotal must be a non-negative number')
  }

  const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']
  if (status && !validStatuses.includes(status)) {
    throw new BadRequestError('Invalid status', `Status must be one of: ${validStatuses.join(', ')}`)
  }
}

export interface UpdateOrderData {
  status?: string
  driverId?: string
  notes?: string
  estimatedDelivery?: string
}

export function validateUpdateOrder(data: UpdateOrderData): void {
  const { status } = data

  const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']
  if (status && !validStatuses.includes(status)) {
    throw new BadRequestError('Invalid status', `Status must be one of: ${validStatuses.join(', ')}`)
  }
}

export interface CreateOrderItemData {
  menuItemId: string
  quantity: number
  notes?: string | null
}

export function validateCreateOrderItem(data: CreateOrderItemData): void {
  const { menuItemId, quantity } = data

  if (!menuItemId) {
    throw new BadRequestError('Missing required fields', 'menuItemId is required')
  }

  if (quantity === undefined || typeof quantity !== 'number' || quantity < 1) {
    throw new BadRequestError('Invalid quantity', 'Quantity must be a positive integer')
  }

  if (!Number.isInteger(quantity)) {
    throw new BadRequestError('Invalid quantity', 'Quantity must be an integer')
  }
}

export interface UpdateOrderItemData {
  quantity?: number
  notes?: string | null
}

export function validateUpdateOrderItem(data: UpdateOrderItemData): void {
  const { quantity } = data

  if (quantity !== undefined) {
    if (typeof quantity !== 'number' || quantity < 1) {
      throw new BadRequestError('Invalid quantity', 'Quantity must be a positive integer')
    }
    if (!Number.isInteger(quantity)) {
      throw new BadRequestError('Invalid quantity', 'Quantity must be an integer')
    }
  }
}

export interface UpdatePaymentData {
  status?: string
}

export function validateUpdatePayment(data: UpdatePaymentData): void {
  const { status } = data

  const validStatuses = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']
  if (status && !validStatuses.includes(status)) {
    throw new BadRequestError('Invalid status', `Status must be one of: ${validStatuses.join(', ')}`)
  }
}
