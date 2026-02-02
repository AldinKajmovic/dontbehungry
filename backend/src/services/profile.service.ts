import { TokenType } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { hashPassword, comparePassword } from '../utils/password'
import { BadRequestError, UnauthorizedError, NotFoundError, ConflictError } from '../utils/errors'
import { UpdateProfile, ChangePassword, UserResponse, userSelectFields } from '../types'
import { createVerificationToken } from './verification.service'
import { sendVerificationEmail } from './email.service'
import { notifyNewOrder, notifyOrderStatusChange, notifyDeliveryReady } from './notification.service'
import { logger } from '../utils/logger'
import { validateStatusTransition } from '../utils/orderStatus'
import { revokeAllUserTokens } from './token.service'

interface UpdateProfileResult {
  user: UserResponse
  emailChanged: boolean
  verificationEmailFailed?: boolean
}

export async function updateProfile(userId: string, data: UpdateProfile): Promise<UpdateProfileResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new NotFoundError('User not found', 'User does not exist')
  }

  const updateData: Record<string, string | boolean | null> = {}
  let emailChanged = false

  if (data.firstName !== undefined) {
    updateData.firstName = data.firstName.trim()
  }

  if (data.lastName !== undefined) {
    updateData.lastName = data.lastName.trim()
  }

  if (data.phone !== undefined) {
    updateData.phone = data.phone ? data.phone.trim() : null
  }

  if (data.email !== undefined) {
    const newEmail = data.email.toLowerCase().trim()

    if (newEmail !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: newEmail },
      })

      if (existingUser) {
        throw new ConflictError('Email taken', 'An account with this email already exists')
      }

      updateData.email = newEmail
      updateData.emailVerified = false
      emailChanged = true
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: userSelectFields,
  })

  let verificationEmailFailed = false
  if (emailChanged) {
    // Security: Revoke all existing tokens when email changes to force re-authentication
    try {
      await revokeAllUserTokens(userId)
    } catch (err) {
      logger.error('Failed to revoke tokens on email change', err, { userId })
    }

    try {
      const verificationToken = await createVerificationToken(userId, TokenType.EMAIL_VERIFICATION)
      await sendVerificationEmail(updatedUser.email, updatedUser.firstName, verificationToken)
    } catch (err) {
      logger.error('Failed to send verification email', err, { userId })
      verificationEmailFailed = true
    }
  }

  return { user: updatedUser, emailChanged, verificationEmailFailed }
}

export async function changePassword(userId: string, data: ChangePassword): Promise<void> {
  const { currentPassword, newPassword } = data

  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new NotFoundError('User not found', 'User does not exist')
  }

  if (!user.passwordHash) {
    throw new BadRequestError('No password set', 'This account uses social login. Please use that method to sign in.')
  }

  const isValidPassword = await comparePassword(currentPassword, user.passwordHash)

  if (!isValidPassword) {
    throw new UnauthorizedError('Invalid password', 'Current password is incorrect')
  }

  const newPasswordHash = await hashPassword(newPassword)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    }),
    prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ])
}

export async function updateAvatar(userId: string, avatarUrl: string | null): Promise<UserResponse> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new NotFoundError('User not found', 'User does not exist')
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl },
    select: userSelectFields,
  })

  return updatedUser
}

export async function deleteAccount(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new NotFoundError('User not found', 'User does not exist')
  }

  await prisma.user.delete({
    where: { id: userId },
  })
}

export interface MyRestaurantResponse {
  id: string
  name: string
  description: string | null
  phone: string | null
  email: string | null
  logoUrl: string | null
  coverUrl: string | null
  rating: string
  minOrderAmount: string | null
  deliveryFee: string | null
  place: {
    id: string
    address: string
    city: string
    country: string
  }
}

export interface CreateMyRestaurantData {
  name: string
  description?: string | null
  phone?: string | null
  email?: string | null
  address: string
  city: string
  country: string
  postalCode?: string | null
  minOrderAmount?: number | null
  deliveryFee?: number | null
}

export interface UpdateMyRestaurantData {
  name?: string
  description?: string | null
  phone?: string | null
  email?: string | null
  minOrderAmount?: number | null
  deliveryFee?: number | null
  logoUrl?: string | null
  coverUrl?: string | null
}

const restaurantSelect = {
  id: true,
  name: true,
  description: true,
  phone: true,
  email: true,
  logoUrl: true,
  coverUrl: true,
  rating: true,
  minOrderAmount: true,
  deliveryFee: true,
  place: {
    select: {
      id: true,
      address: true,
      city: true,
      country: true,
    },
  },
}

function formatRestaurant(restaurant: {
  id: string
  name: string
  description: string | null
  phone: string | null
  email: string | null
  logoUrl: string | null
  coverUrl: string | null
  rating: { toString(): string }
  minOrderAmount: { toString(): string } | null
  deliveryFee: { toString(): string } | null
  place: { id: string; address: string; city: string; country: string }
}): MyRestaurantResponse {
  return {
    id: restaurant.id,
    name: restaurant.name,
    description: restaurant.description,
    phone: restaurant.phone,
    email: restaurant.email,
    logoUrl: restaurant.logoUrl,
    coverUrl: restaurant.coverUrl,
    rating: restaurant.rating.toString(),
    minOrderAmount: restaurant.minOrderAmount?.toString() ?? null,
    deliveryFee: restaurant.deliveryFee?.toString() ?? null,
    place: restaurant.place,
  }
}

export async function getMyRestaurants(userId: string): Promise<MyRestaurantResponse[]> {
  const restaurants = await prisma.restaurant.findMany({
    where: { ownerId: userId },
    include: {
      place: {
        select: {
          id: true,
          address: true,
          city: true,
          country: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return restaurants.map(formatRestaurant)
}

export async function createMyRestaurant(userId: string, data: CreateMyRestaurantData): Promise<MyRestaurantResponse> {

  const place = await prisma.place.create({
    data: {
      address: data.address.trim(),
      city: data.city.trim(),
      country: data.country.trim(),
      postalCode: data.postalCode?.trim() || null,
    },
  })

  const restaurant = await prisma.restaurant.create({
    data: {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      phone: data.phone?.trim() || null,
      email: data.email?.trim()?.toLowerCase() || null,
      ownerId: userId,
      placeId: place.id,
      minOrderAmount: data.minOrderAmount ?? null,
      deliveryFee: data.deliveryFee ?? null,
    },
    select: restaurantSelect,
  })

  return formatRestaurant(restaurant)
}

export async function updateMyRestaurant(userId: string, restaurantId: string, data: UpdateMyRestaurantData): Promise<MyRestaurantResponse> {
  const restaurant = await prisma.restaurant.findFirst({
    where: { id: restaurantId, ownerId: userId },
  })

  if (!restaurant) {
    throw new NotFoundError('Restaurant not found', 'You do not own this restaurant')
  }

  const updateData: Record<string, unknown> = {}

  if (data.name !== undefined) {
    updateData.name = data.name.trim()
  }
  if (data.description !== undefined) {
    updateData.description = data.description?.trim() || null
  }
  if (data.phone !== undefined) {
    updateData.phone = data.phone?.trim() || null
  }
  if (data.email !== undefined) {
    updateData.email = data.email?.trim()?.toLowerCase() || null
  }
  if (data.minOrderAmount !== undefined) {
    updateData.minOrderAmount = data.minOrderAmount
  }
  if (data.deliveryFee !== undefined) {
    updateData.deliveryFee = data.deliveryFee
  }
  if (data.logoUrl !== undefined) {
    updateData.logoUrl = data.logoUrl?.trim() || null
  }
  if (data.coverUrl !== undefined) {
    updateData.coverUrl = data.coverUrl?.trim() || null
  }

  const updated = await prisma.restaurant.update({
    where: { id: restaurantId },
    data: updateData,
    select: restaurantSelect,
  })

  return formatRestaurant(updated)
}

export async function deleteMyRestaurant(userId: string, restaurantId: string): Promise<void> {
  const restaurant = await prisma.restaurant.findFirst({
    where: { id: restaurantId, ownerId: userId },
  })

  if (!restaurant) {
    throw new NotFoundError('Restaurant not found', 'You do not own this restaurant')
  }

  await prisma.restaurant.delete({
    where: { id: restaurantId },
  })
}

// Menu Items for Restaurant Owners

export interface MyMenuItemResponse {
  id: string
  name: string
  description: string | null
  price: string
  imageUrl: string | null
  isAvailable: boolean
  preparationTime: number | null
  category: { id: string; name: string } | null
}

export interface CreateMyMenuItemData {
  name: string
  description?: string | null
  price: number
  imageUrl?: string | null
  categoryId?: string | null
  isAvailable?: boolean
  preparationTime?: number | null
}

export interface UpdateMyMenuItemData {
  name?: string
  description?: string | null
  price?: number
  imageUrl?: string | null
  categoryId?: string | null
  isAvailable?: boolean
  preparationTime?: number | null
}

const menuItemSelect = {
  id: true,
  name: true,
  description: true,
  price: true,
  imageUrl: true,
  isAvailable: true,
  preparationTime: true,
  category: {
    select: { id: true, name: true },
  },
}

function formatMenuItem(item: {
  id: string
  name: string
  description: string | null
  price: { toString(): string }
  imageUrl: string | null
  isAvailable: boolean
  preparationTime: number | null
  category: { id: string; name: string } | null
}): MyMenuItemResponse {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price.toString(),
    imageUrl: item.imageUrl,
    isAvailable: item.isAvailable,
    preparationTime: item.preparationTime,
    category: item.category,
  }
}

async function verifyRestaurantOwnership(userId: string, restaurantId: string) {
  const restaurant = await prisma.restaurant.findFirst({
    where: { id: restaurantId, ownerId: userId },
  })
  if (!restaurant) {
    throw new NotFoundError('Restaurant not found', 'You do not own this restaurant')
  }
  return restaurant
}

export async function getMyMenuItems(userId: string, restaurantId: string): Promise<MyMenuItemResponse[]> {
  await verifyRestaurantOwnership(userId, restaurantId)

  const items = await prisma.menuItem.findMany({
    where: { restaurantId },
    select: menuItemSelect,
    orderBy: { name: 'asc' },
  })

  return items.map(formatMenuItem)
}

export async function createMyMenuItem(userId: string, restaurantId: string, data: CreateMyMenuItemData): Promise<MyMenuItemResponse> {
  await verifyRestaurantOwnership(userId, restaurantId)

  if (data.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } })
    if (!category) {
      throw new NotFoundError('Category not found', `No category found with ID: ${data.categoryId}`)
    }
  }

  const item = await prisma.menuItem.create({
    data: {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      price: data.price,
      imageUrl: data.imageUrl?.trim() || null,
      restaurantId,
      categoryId: data.categoryId || null,
      isAvailable: data.isAvailable ?? true,
      preparationTime: data.preparationTime ?? null,
    },
    select: menuItemSelect,
  })

  return formatMenuItem(item)
}

export async function updateMyMenuItem(userId: string, restaurantId: string, itemId: string, data: UpdateMyMenuItemData): Promise<MyMenuItemResponse> {
  await verifyRestaurantOwnership(userId, restaurantId)

  const existingItem = await prisma.menuItem.findFirst({
    where: { id: itemId, restaurantId },
  })
  if (!existingItem) {
    throw new NotFoundError('Menu item not found', 'This menu item does not exist in your restaurant')
  }

  if (data.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } })
    if (!category) {
      throw new NotFoundError('Category not found', `No category found with ID: ${data.categoryId}`)
    }
  }

  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name.trim()
  if (data.description !== undefined) updateData.description = data.description?.trim() || null
  if (data.price !== undefined) updateData.price = data.price
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl?.trim() || null
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId || null
  if (data.isAvailable !== undefined) updateData.isAvailable = data.isAvailable
  if (data.preparationTime !== undefined) updateData.preparationTime = data.preparationTime

  const item = await prisma.menuItem.update({
    where: { id: itemId },
    data: updateData,
    select: menuItemSelect,
  })

  return formatMenuItem(item)
}

export async function deleteMyMenuItem(userId: string, restaurantId: string, itemId: string): Promise<void> {
  await verifyRestaurantOwnership(userId, restaurantId)

  const existingItem = await prisma.menuItem.findFirst({
    where: { id: itemId, restaurantId },
  })
  if (!existingItem) {
    throw new NotFoundError('Menu item not found', 'This menu item does not exist in your restaurant')
  }

  await prisma.menuItem.delete({ where: { id: itemId } })
}

export async function getCategories(): Promise<{ id: string; name: string }[]> {
  return prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
}

export interface OrderHistoryFilters {
  createdAtFrom?: Date
  createdAtTo?: Date
  status?: string
  page?: number
  limit?: number
}

export interface OrderHistoryItem {
  id: string
  status: string
  totalAmount: string
  createdAt: string
  deliveredAt: string | null
  restaurant: { id: string; name: string }
  deliveryPlace: { address: string; city: string }
  orderItems: Array<{ name: string; quantity: number; unitPrice: string }>
  payment: { status: string; method: string } | null
}

export interface OrderHistoryResponse {
  orders: OrderHistoryItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

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
  deliveryPlace: { address: string; city: string }
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
    deliveryPlace: order.deliveryPlace,
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

export interface RestaurantOrderItem extends OrderHistoryItem {
  customerName: string
  customerPhone: string | null
}

export interface RestaurantOrdersResponse {
  orders: RestaurantOrderItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreateOrderData {
  restaurantId: string
  deliveryAddressId: string
  paymentMethod: 'CASH' | 'CREDIT_CARD' | 'DIGITAL_WALLET'
  notes?: string
  items: Array<{
    menuItemId: string
    quantity: number
    notes?: string
  }>
}

export interface CreatedOrderResponse {
  id: string
  status: string
  totalAmount: string
  createdAt: string
  restaurant: { id: string; name: string }
  deliveryPlace: { address: string; city: string }
  orderItems: Array<{ name: string; quantity: number; unitPrice: string }>
  payment: { status: string; method: string }
}

export async function createOrder(userId: string, data: CreateOrderData): Promise<CreatedOrderResponse> {

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: data.restaurantId },
    select: {
      id: true,
      name: true,
      deliveryFee: true,
      minOrderAmount: true,
      ownerId: true,
    },
  })

  if (!restaurant) {
    throw new NotFoundError('Restaurant not found', 'The specified restaurant does not exist')
  }

  const userAddress = await prisma.userAddress.findFirst({
    where: {
      id: data.deliveryAddressId,
      userId,
    },
    include: {
      place: true,
    },
  })

  if (!userAddress) {
    throw new NotFoundError('Address not found', 'The specified delivery address does not exist')
  }

  const menuItemIds = data.items.map((item) => item.menuItemId)
  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: menuItemIds },
      restaurantId: data.restaurantId,
      isAvailable: true,
    },
  })

  if (menuItems.length !== menuItemIds.length) {
    throw new BadRequestError('Invalid items', 'Some menu items are not available or do not belong to this restaurant')
  }

  const menuItemMap = new Map(menuItems.map((item) => [item.id, item]))

  let subtotal = 0
  const orderItemsData = data.items.map((item) => {
    const menuItem = menuItemMap.get(item.menuItemId)!
    const unitPrice = Number(menuItem.price)
    const totalPrice = unitPrice * item.quantity
    subtotal += totalPrice

    return {
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      unitPrice,
      totalPrice,
      notes: item.notes || null,
    }
  })

  const minOrderAmount = restaurant.minOrderAmount ? Number(restaurant.minOrderAmount) : 0
  const minOrderFee = subtotal < minOrderAmount ? 5 : 0

  const deliveryFee = restaurant.deliveryFee ? Number(restaurant.deliveryFee) : 0
  const tax = subtotal * 0.20 // 20% tax
  const totalAmount = subtotal + deliveryFee + tax + minOrderFee

  const order = await prisma.$transaction(async (tx) => {

    const newOrder = await tx.order.create({
      data: {
        userId,
        restaurantId: data.restaurantId,
        deliveryPlaceId: userAddress.placeId,
        status: 'PENDING',
        subtotal,
        deliveryFee,
        tax,
        totalAmount,
        notes: data.notes || null,
      },
    })

    await tx.orderItem.createMany({
      data: orderItemsData.map((item) => ({
        orderId: newOrder.id,
        ...item,
      })),
    })

    await tx.payment.create({
      data: {
        orderId: newOrder.id,
        amount: totalAmount,
        method: data.paymentMethod,
        status: 'PENDING',
      },
    })

    return newOrder
  })

  const completeOrder = await prisma.order.findUnique({
    where: { id: order.id },
    select: {
      id: true,
      status: true,
      totalAmount: true,
      createdAt: true,
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
    },
  })

  if (!completeOrder) {
    throw new Error('Failed to fetch created order')
  }

  notifyNewOrder(
    restaurant.ownerId,
    completeOrder.id,
    restaurant.name,
    completeOrder.totalAmount.toString()
  )

  return {
    id: completeOrder.id,
    status: completeOrder.status,
    totalAmount: completeOrder.totalAmount.toString(),
    createdAt: completeOrder.createdAt.toISOString(),
    restaurant: completeOrder.restaurant,
    deliveryPlace: completeOrder.deliveryPlace,
    orderItems: completeOrder.orderItems.map((item) => ({
      name: item.menuItem.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toString(),
    })),
    payment: completeOrder.payment!,
  }
}

export interface UpdateRestaurantOrderData {
  status: string
  notes?: string
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

  return updated
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
