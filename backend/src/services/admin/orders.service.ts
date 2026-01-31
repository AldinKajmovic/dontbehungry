import { prisma } from '../../lib/prisma'
import { NotFoundError } from '../../utils/errors'
import { PaginatedResponse } from '../../types'
import { PaginationParams, OrderFilters, UpdateOrderData } from '../../validators/admin.validator'
import { OrderStatus } from '@prisma/client'

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
        include: { menuItem: { select: { id: true, name: true } } },
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
  await getOrderById(id)

  if (data.driverId) {
    const driver = await prisma.user.findUnique({ where: { id: data.driverId } })
    if (!driver) {
      throw new NotFoundError('Driver not found', `No user found with ID: ${data.driverId}`)
    }
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
  const restaurant = await prisma.restaurant.findUnique({ where: { id: data.restaurantId } })
  if (!restaurant) {
    throw new NotFoundError('Restaurant not found', `No restaurant found with ID: ${data.restaurantId}`)
  }

  // Validate delivery place exists
  const place = await prisma.place.findUnique({ where: { id: data.deliveryPlaceId } })
  if (!place) {
    throw new NotFoundError('Place not found', `No place found with ID: ${data.deliveryPlaceId}`)
  }

  // Validate driver if provided
  if (data.driverId) {
    const driver = await prisma.user.findUnique({ where: { id: data.driverId } })
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

  return order
}
