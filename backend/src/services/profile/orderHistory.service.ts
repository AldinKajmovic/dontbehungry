// Order history queries: getMyOrderHistory, getDriverOrderHistory, getRestaurantOrders, updateRestaurantOrderStatus
import { prisma } from '../../lib/prisma'
import { NotFoundError } from '../../utils/errors'
import { validateStatusTransition } from '../../utils/orderStatus'
import { notifyOrderStatusChange, notifyDeliveryReady } from '../notification.service'
import { removeOrderFromDriverQueues } from './orderBroadcast.service'
import { logger } from '../../utils/logger'
import {
  OrderHistoryFilters,
  OrderHistoryItem,
  OrderHistoryResponse,
  RestaurantOrderItem,
  RestaurantOrdersResponse,
  UpdateRestaurantOrderData,
} from './types'

const orderHistorySelect = {
  id: true,
  status: true,
  totalAmount: true,
  createdAt: true,
  deliveredAt: true,
  restaurant: {
    select: {
      id: true,
      name: true,
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
    select: {
      quantity: true,
      unitPrice: true,
      menuItem: {
        select: {
          name: true,
        },
      },
    },
  },
  payment: {
    select: {
      status: true,
      method: true,
    },
  },
}

function formatOrderHistoryItem(order: {
  id: string
  status: string
  totalAmount: { toString(): string }
  createdAt: Date
  deliveredAt: Date | null
  restaurant: { id: string; name: string }
  deliveryPlace: { address: string; city: string; latitude: { toNumber(): number } | null; longitude: { toNumber(): number } | null }
  orderItems: Array<{ quantity: number; unitPrice: { toString(): string }; menuItem: { name: string } }>
  payment: { status: string; method: string } | null
}): OrderHistoryItem {
  return {
    id: order.id,
    status: order.status,
    totalAmount: order.totalAmount.toString(),
    createdAt: order.createdAt.toISOString(),
    deliveredAt: order.deliveredAt?.toISOString() ?? null,
    restaurant: order.restaurant,
    deliveryPlace: {
      address: order.deliveryPlace.address,
      city: order.deliveryPlace.city,
      latitude: order.deliveryPlace.latitude?.toNumber() ?? null,
      longitude: order.deliveryPlace.longitude?.toNumber() ?? null,
    },
    orderItems: order.orderItems.map((item) => ({
      name: item.menuItem.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toString(),
    })),
    payment: order.payment,
  }
}

export async function getMyOrderHistory(userId: string, filters: OrderHistoryFilters): Promise<OrderHistoryResponse> {
  const page = filters.page || 1
  const limit = filters.limit || 10

  const where: Record<string, unknown> = { userId }

  if (filters.status) {
    where.status = filters.status
  }

  if (filters.createdAtFrom || filters.createdAtTo) {
    where.createdAt = {}
    if (filters.createdAtFrom) {
      (where.createdAt as Record<string, Date>).gte = filters.createdAtFrom
    }
    if (filters.createdAtTo) {
      (where.createdAt as Record<string, Date>).lte = filters.createdAtTo
    }
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      select: orderHistorySelect,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ])

  return {
    orders: orders.map(formatOrderHistoryItem),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getDriverOrderHistory(driverId: string, filters: OrderHistoryFilters): Promise<OrderHistoryResponse> {
  const page = filters.page || 1
  const limit = filters.limit || 10

  const where: Record<string, unknown> = { driverId }

  if (filters.status) {
    where.status = filters.status
  }

  if (filters.createdAtFrom || filters.createdAtTo) {
    where.createdAt = {}
    if (filters.createdAtFrom) {
      (where.createdAt as Record<string, Date>).gte = filters.createdAtFrom
    }
    if (filters.createdAtTo) {
      (where.createdAt as Record<string, Date>).lte = filters.createdAtTo
    }
  }

  const driverOrderSelect = {
    ...orderHistorySelect,
    user: {
      select: {
        firstName: true,
      },
    },
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      select: driverOrderSelect,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ])

  return {
    orders: orders.map((order) => ({
      ...formatOrderHistoryItem(order),
      customerFirstName: order.user.firstName,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getRestaurantOrders(
  ownerId: string,
  restaurantId: string,
  filters: OrderHistoryFilters
): Promise<RestaurantOrdersResponse> {
  const restaurant = await prisma.restaurant.findFirst({
    where: { id: restaurantId, ownerId },
  })

  if (!restaurant) {
    throw new NotFoundError('Restaurant not found', 'You do not own this restaurant')
  }

  const page = filters.page || 1
  const limit = filters.limit || 10

  const where: Record<string, unknown> = { restaurantId }

  if (filters.status) {
    where.status = filters.status
  }

  if (filters.createdAtFrom || filters.createdAtTo) {
    where.createdAt = {}
    if (filters.createdAtFrom) {
      (where.createdAt as Record<string, Date>).gte = filters.createdAtFrom
    }
    if (filters.createdAtTo) {
      (where.createdAt as Record<string, Date>).lte = filters.createdAtTo
    }
  }

  const restaurantOrderSelect = {
    ...orderHistorySelect,
    user: {
      select: {
        firstName: true,
        lastName: true,
        phone: true,
      },
    },
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      select: restaurantOrderSelect,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ])

  return {
    orders: orders.map((order) => ({
      ...formatOrderHistoryItem(order),
      customerName: `${order.user.firstName} ${order.user.lastName}`,
      customerPhone: order.user.phone,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function updateRestaurantOrderStatus(
  ownerId: string,
  restaurantId: string,
  orderId: string,
  data: UpdateRestaurantOrderData
): Promise<{ id: string; status: string }> {
  const restaurant = await prisma.restaurant.findFirst({
    where: { id: restaurantId, ownerId },
  })

  if (!restaurant) {
    throw new NotFoundError('Restaurant not found', 'You do not own this restaurant')
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
    select: {
      id: true,
      status: true,
      userId: true,
      driverId: true,
    },
  })

  if (!order) {
    throw new NotFoundError('Order not found', 'This order does not belong to your restaurant')
  }

  // Validate status transition
  validateStatusTransition(order.status, data.status)

  const updateData: Record<string, unknown> = {
    status: data.status,
  }

  if (data.status === 'DELIVERED') {
    updateData.deliveredAt = new Date()
  }

  if (data.notes !== undefined) {
    updateData.notes = data.notes || null
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: updateData,
    select: {
      id: true,
      status: true,
    },
  })

  notifyOrderStatusChange(order.userId, orderId, data.status, restaurant.name)

  if (data.status === 'READY_FOR_PICKUP' && order.driverId) {
    notifyDeliveryReady(order.driverId, orderId, restaurant.name)
  }

  // If cancelled and no driver was assigned, remove from driver queues
  if (data.status === 'CANCELLED' && !order.driverId) {
    removeOrderFromDriverQueues(orderId, 'cancelled').catch((err) => {
      logger.error('Failed to remove cancelled order from driver queues', err, { orderId })
    })
  }

  return updated
}
