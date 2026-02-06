import { prisma } from '../../lib/prisma'
import { NotFoundError } from '../../utils/errors'
import { PaginatedResponse } from '../../types'
import { PaginationParams, OrderFilters, UpdateOrderData } from '../../validators/admin'
import { OrderStatus, Prisma } from '@prisma/client'
import {
  notifyDeliveryAssigned,
  notifyDeliveryReady,
  notifyNewOrder,
  notifyOrderStatusChange,
  notifyRestaurantDriverAssigned,
  notifyRestaurantOrderStatusChange,
} from '../notification.service'
import { validateStatusTransition } from '../../utils/orderStatus'
import { removeOrderFromDriverQueues } from '../profile/orderBroadcast.service'
import { logger } from '../../utils/logger'

export async function getOrders(params: PaginationParams, filters: OrderFilters = {}): Promise<PaginatedResponse<object>> {
  const { page, limit, search, sortBy, sortOrder } = params
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}

  if (search) {
    where.OR = [
      { id: { contains: search, mode: 'insensitive' as const } },
      { user: { email: { contains: search, mode: 'insensitive' as const } } },
    ]
  }

  if (filters.status) {
    where.status = filters.status
  }

  if (filters.paymentStatus) {
    where.payment = { status: filters.paymentStatus }
  }

  if (filters.restaurantId) {
    where.restaurantId = filters.restaurantId
  }

  if (filters.customerId) {
    where.userId = filters.customerId
  }

  if (filters.driverId) {
    where.driverId = filters.driverId
  }

  if (filters.minTotalAmount !== undefined || filters.maxTotalAmount !== undefined) {
    where.totalAmount = {}
    if (filters.minTotalAmount !== undefined) (where.totalAmount as Record<string, number>).gte = filters.minTotalAmount
    if (filters.maxTotalAmount !== undefined) (where.totalAmount as Record<string, number>).lte = filters.maxTotalAmount
  }

  if (filters.createdAtFrom !== undefined || filters.createdAtTo !== undefined) {
    where.createdAt = {}
    if (filters.createdAtFrom !== undefined) (where.createdAt as Record<string, Date>).gte = filters.createdAtFrom
    if (filters.createdAtTo !== undefined) (where.createdAt as Record<string, Date>).lte = filters.createdAtTo
  }

  const validSortFields = ['status', 'totalAmount', 'subtotal', 'createdAt']
  const orderBy = sortBy && validSortFields.includes(sortBy)
    ? { [sortBy]: sortOrder || 'asc' }
    : { createdAt: 'desc' as const }

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        restaurant: { select: { id: true, name: true } },
        deliveryPlace: true,
        driver: { select: { id: true, email: true, firstName: true, lastName: true } },
        payment: true,
        orderItems: {
          include: { menuItem: { select: { id: true, name: true, price: true } } },
        },
      },
      skip,
      take: limit,
      orderBy,
    }),
    prisma.order.count({ where }),
  ])

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getOrderById(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      restaurant: { select: { id: true, name: true } },
      deliveryPlace: true,
      driver: { select: { id: true, email: true, firstName: true, lastName: true } },
      orderItems: {
        include: { menuItem: { select: { id: true, name: true, price: true } } },
      },
      payment: true,
    },
  })

  if (!order) {
    throw new NotFoundError('Order not found', `No order found with ID: ${id}`)
  }

  return order
}

export async function updateOrder(id: string, data: UpdateOrderData) {

  const existingOrder = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true } },
      restaurant: {
        select: {
          id: true,
          name: true,
          ownerId: true,
        },
      },
      deliveryPlace: { select: { address: true } },
      driver: { select: { id: true, firstName: true, lastName: true } },
    },
  })

  if (!existingOrder) {
    throw new NotFoundError('Order not found', `No order found with ID: ${id}`)
  }

  // Validate status transition (admin has override for non-standard transitions, but not terminal states)
  if (data.status) {
    validateStatusTransition(existingOrder.status, data.status, true)
  }

  let newDriver: { id: string; firstName: string; lastName: string } | null = null
  if (data.driverId) {
    const driver = await prisma.user.findUnique({
      where: { id: data.driverId },
      select: { id: true, firstName: true, lastName: true },
    })
    if (!driver) {
      throw new NotFoundError('Driver not found', `No user found with ID: ${data.driverId}`)
    }
    newDriver = driver
  }

  const order = await prisma.order.update({
    where: { id },
    data: {
      ...(data.status && { status: data.status as OrderStatus }),
      ...(data.driverId !== undefined && { driverId: data.driverId || null }),
      ...(data.notes !== undefined && { notes: data.notes || null }),
      ...(data.estimatedDelivery && { estimatedDelivery: new Date(data.estimatedDelivery) }),
      ...(data.status === 'DELIVERED' && { deliveredAt: new Date() }),
    },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      restaurant: { select: { id: true, name: true } },
      deliveryPlace: true,
      driver: { select: { id: true, email: true, firstName: true, lastName: true } },
      payment: true,
    },
  })

  const driverChanged = data.driverId && data.driverId !== existingOrder.driverId
  if (driverChanged && newDriver) {
    // Remove from driver queues since admin assigned a driver
    // When admin assigns a driver, it won't broadcast to other drivers because it already has a driver
    removeOrderFromDriverQueues(id, 'assigned').catch((err) => {
      logger.error('Failed to remove admin-assigned order from driver queues', err, { orderId: id })
    })

    const driverName = `${newDriver.firstName} ${newDriver.lastName}`
    const deliveryAddress = existingOrder.deliveryPlace?.address || 'N/A'

    notifyDeliveryAssigned(
      newDriver.id,
      id,
      existingOrder.restaurant.name,
      deliveryAddress
    )

    if (existingOrder.restaurant.ownerId) {
      notifyRestaurantDriverAssigned(
        existingOrder.restaurant.ownerId,
        id,
        existingOrder.restaurant.name,
        driverName
      )
    }
  }

  const statusChanged = data.status && data.status !== existingOrder.status
  if (statusChanged && data.status) {

    notifyOrderStatusChange(
      existingOrder.user.id,
      id,
      data.status,
      existingOrder.restaurant.name
    )

    if (existingOrder.restaurant.ownerId) {
      notifyRestaurantOrderStatusChange(
        existingOrder.restaurant.ownerId,
        id,
        data.status,
        existingOrder.restaurant.name
      )
    }

    if (data.status === 'READY_FOR_PICKUP' && order.driver) {
      notifyDeliveryReady(
        order.driver.id,
        id,
        existingOrder.restaurant.name
      )
    }
  }

  return order
}

export async function deleteOrder(id: string) {
  await getOrderById(id)
  await prisma.order.delete({ where: { id } })
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

export async function createOrder(data: CreateOrderData) {
  // Validate user exists
  const user = await prisma.user.findUnique({ where: { id: data.userId } })
  if (!user) {
    throw new NotFoundError('User not found', `No user found with ID: ${data.userId}`)
  }

  // Validate restaurant exists
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: data.restaurantId },
    select: { id: true, name: true, ownerId: true },
  })
  if (!restaurant) {
    throw new NotFoundError('Restaurant not found', `No restaurant found with ID: ${data.restaurantId}`)
  }

  // Validate delivery place exists
  const place = await prisma.place.findUnique({
    where: { id: data.deliveryPlaceId },
    select: { id: true, address: true },
  })
  if (!place) {
    throw new NotFoundError('Place not found', `No place found with ID: ${data.deliveryPlaceId}`)
  }

  // Validate driver if provided
  let driver: { id: string; firstName: string; lastName: string } | null = null
  if (data.driverId) {
    driver = await prisma.user.findUnique({
      where: { id: data.driverId },
      select: { id: true, firstName: true, lastName: true },
    })
    if (!driver) {
      throw new NotFoundError('Driver not found', `No user found with ID: ${data.driverId}`)
    }
  }

  const subtotal = data.subtotal
  const deliveryFee = data.deliveryFee || 0
  const tax = data.tax || 0
  const totalAmount = subtotal + deliveryFee + tax

  const order = await prisma.order.create({
    data: {
      userId: data.userId,
      restaurantId: data.restaurantId,
      deliveryPlaceId: data.deliveryPlaceId,
      driverId: data.driverId || null,
      status: (data.status as OrderStatus) || 'PENDING',
      subtotal,
      deliveryFee,
      tax,
      totalAmount,
      notes: data.notes || null,
    },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      restaurant: { select: { id: true, name: true } },
      deliveryPlace: true,
      driver: { select: { id: true, email: true, firstName: true, lastName: true } },
      payment: true,
    },
  })

  if (restaurant.ownerId) {
    notifyNewOrder(
      restaurant.ownerId,
      order.id,
      restaurant.name,
      totalAmount.toFixed(2)
    )
  }

  if (driver) {
    const driverName = `${driver.firstName} ${driver.lastName}`

    notifyDeliveryAssigned(
      driver.id,
      order.id,
      restaurant.name,
      place.address || 'N/A'
    )

    if (restaurant.ownerId) {
      notifyRestaurantDriverAssigned(
        restaurant.ownerId,
        order.id,
        restaurant.name,
        driverName
      )
    }
  }

  return order
}

// ============ Order Items CRUD ============

export interface CreateOrderItemData {
  menuItemId: string
  quantity: number
  notes?: string | null
}

export interface UpdateOrderItemData {
  quantity?: number
  notes?: string | null
}

const orderItemSelect = {
  id: true,
  orderId: true,
  menuItemId: true,
  quantity: true,
  unitPrice: true,
  totalPrice: true,
  notes: true,
  menuItem: {
    select: { id: true, name: true, price: true },
  },
}

export async function getOrderItems(orderId: string) {

  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) {
    throw new NotFoundError('Order not found', `No order found with ID: ${orderId}`)
  }

  return prisma.orderItem.findMany({
    where: { orderId },
    select: orderItemSelect,
    orderBy: { menuItem: { name: 'asc' } },
  })
}

export async function addOrderItem(orderId: string, data: CreateOrderItemData) {

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, restaurantId: true },
  })
  if (!order) {
    throw new NotFoundError('Order not found', `No order found with ID: ${orderId}`)
  }

  const menuItem = await prisma.menuItem.findUnique({
    where: { id: data.menuItemId },
    select: { id: true, price: true, restaurantId: true },
  })
  if (!menuItem) {
    throw new NotFoundError('Menu item not found', `No menu item found with ID: ${data.menuItemId}`)
  }
  if (menuItem.restaurantId !== order.restaurantId) {
    throw new NotFoundError('Invalid menu item', 'Menu item does not belong to the order restaurant')
  }

  const unitPrice = menuItem.price
  const totalPrice = unitPrice.mul(data.quantity)


  const orderItem = await prisma.orderItem.create({
    data: {
      orderId,
      menuItemId: data.menuItemId,
      quantity: data.quantity,
      unitPrice,
      totalPrice,
      notes: data.notes || null,
    },
    select: orderItemSelect,
  })

  await recalculateOrderTotals(orderId)

  return orderItem
}

export async function updateOrderItem(itemId: string, data: UpdateOrderItemData) {
  const existingItem = await prisma.orderItem.findUnique({
    where: { id: itemId },
    select: { id: true, orderId: true, unitPrice: true },
  })

  if (!existingItem) {
    throw new NotFoundError('Order item not found', `No order item found with ID: ${itemId}`)
  }

  const updateData: Record<string, unknown> = {}

  if (data.quantity !== undefined) {
    updateData.quantity = data.quantity
    updateData.totalPrice = existingItem.unitPrice.mul(data.quantity)
  }

  if (data.notes !== undefined) {
    updateData.notes = data.notes || null
  }

  const orderItem = await prisma.orderItem.update({
    where: { id: itemId },
    data: updateData,
    select: orderItemSelect,
  })

  await recalculateOrderTotals(existingItem.orderId)

  return orderItem
}

export async function deleteOrderItem(itemId: string) {
  const existingItem = await prisma.orderItem.findUnique({
    where: { id: itemId },
    select: { id: true, orderId: true },
  })

  if (!existingItem) {
    throw new NotFoundError('Order item not found', `No order item found with ID: ${itemId}`)
  }

  await prisma.orderItem.delete({ where: { id: itemId } })
  await recalculateOrderTotals(existingItem.orderId)
}

async function recalculateOrderTotals(orderId: string) {
  const orderItems = await prisma.orderItem.findMany({
    where: { orderId },
    select: { totalPrice: true },
  })

  const subtotal = orderItems.reduce(
    (sum, item) => sum.add(item.totalPrice),
    new Prisma.Decimal(0)
  )

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { deliveryFee: true, tax: true },
  })

  if (order) {
    const totalAmount = subtotal.add(order.deliveryFee).add(order.tax)
    await prisma.order.update({
      where: { id: orderId },
      data: { subtotal, totalAmount },
    })
  }
}
