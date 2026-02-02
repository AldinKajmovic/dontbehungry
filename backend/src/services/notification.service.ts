import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { emitToUser } from '../socket'
import { NotFoundError, ForbiddenError } from '../utils/errors'
import { logger } from '../utils/logger'

export type NotificationType = 'ORDER_NEW' | 'ORDER_STATUS' | 'DELIVERY_ASSIGNED' | 'DELIVERY_READY'

export interface CreateNotificationData {
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, unknown>
}

export interface NotificationResponse {
  id: string
  type: string
  title: string
  message: string
  data: Record<string, unknown> | null
  isRead: boolean
  createdAt: string
}

export interface NotificationsListResponse {
  notifications: NotificationResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const notificationSelect = {
  id: true,
  type: true,
  title: true,
  message: true,
  data: true,
  isRead: true,
  createdAt: true,
}

function formatNotification(notification: {
  id: string
  type: string
  title: string
  message: string
  data: unknown
  isRead: boolean
  createdAt: Date
}): NotificationResponse {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    data: notification.data as Record<string, unknown> | null,
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString(),
  }
}

export async function createNotification(data: CreateNotificationData): Promise<NotificationResponse> {

  const user = await prisma.user.findUnique({
    where: { id: data.userId },
    select: { id: true, role: true },
  })

  if (!user) {
    throw new NotFoundError('User not found', 'Cannot create notification for non-existent user')
  }

  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    throw new ForbiddenError('Not allowed', 'Admin users do not receive notifications')
  }

  const notification = await prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data ? (data.data as Prisma.InputJsonValue) : Prisma.JsonNull,
    },
    select: notificationSelect,
  })

  const formatted = formatNotification(notification)
  emitToUser(data.userId, 'notification', formatted)

  return formatted
}

export async function getNotifications(
  userId: string,
  page: number = 1,
  limit: number = 5
): Promise<NotificationsListResponse> {
  const where = { userId }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      select: notificationSelect,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ])

  return {
    notifications: notifications.map(formatNotification),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, isRead: false },
  })
}

export async function markAsRead(notificationId: string, userId: string): Promise<NotificationResponse> {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  })

  if (!notification) {
    throw new NotFoundError('Notification not found', 'This notification does not exist')
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
    select: notificationSelect,
  })

  return formatNotification(updated)
}

export async function markAllAsRead(userId: string): Promise<{ count: number }> {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  })

  return { count: result.count }
}

export async function deleteNotification(notificationId: string, userId: string): Promise<void> {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  })

  if (!notification) {
    throw new NotFoundError('Notification not found', 'This notification does not exist')
  }

  await prisma.notification.delete({
    where: { id: notificationId },
  })
}

export async function notifyNewOrder(
  restaurantOwnerId: string,
  orderId: string,
  restaurantName: string,
  totalAmount: string
): Promise<void> {
  try {
    await createNotification({
      userId: restaurantOwnerId,
      type: 'ORDER_NEW',
      title: 'New Order Received',
      message: `You have a new order at ${restaurantName} for $${totalAmount}`,
      data: { orderId, restaurantName, totalAmount },
    })
  } catch (error) {
    logger.error('Failed to create new order notification', error, { orderId, restaurantOwnerId })
  }
}

export async function notifyOrderStatusChange(
  customerId: string,
  orderId: string,
  status: string,
  restaurantName: string
): Promise<void> {
  const statusMessages: Record<string, string> = {
    CONFIRMED: `Your order from ${restaurantName} has been confirmed`,
    PREPARING: `${restaurantName} is now preparing your order`,
    READY_FOR_PICKUP: `Your order from ${restaurantName} is ready for pickup`,
    OUT_FOR_DELIVERY: `Your order from ${restaurantName} is on its way`,
    DELIVERED: `Your order from ${restaurantName} has been delivered`,
    CANCELLED: `Your order from ${restaurantName} has been cancelled`,
  }

  const message = statusMessages[status] || `Order status updated to ${status}`

  try {
    await createNotification({
      userId: customerId,
      type: 'ORDER_STATUS',
      title: 'Order Update',
      message,
      data: { orderId, status, restaurantName },
    })
  } catch (error) {
    logger.error('Failed to create order status notification', error, { orderId, customerId, status })
  }
}

export async function notifyDeliveryAssigned(
  driverId: string,
  orderId: string,
  restaurantName: string,
  deliveryAddress: string
): Promise<void> {
  try {
    await createNotification({
      userId: driverId,
      type: 'DELIVERY_ASSIGNED',
      title: 'New Delivery Assignment',
      message: `You have been assigned to deliver from ${restaurantName}`,
      data: { orderId, restaurantName, deliveryAddress },
    })
  } catch (error) {
    logger.error('Failed to create delivery assigned notification', error, { orderId, driverId })
  }
}

export async function notifyDeliveryReady(
  driverId: string,
  orderId: string,
  restaurantName: string
): Promise<void> {
  try {
    await createNotification({
      userId: driverId,
      type: 'DELIVERY_READY',
      title: 'Order Ready for Pickup',
      message: `Order from ${restaurantName} is ready for pickup`,
      data: { orderId, restaurantName },
    })
  } catch (error) {
    logger.error('Failed to create delivery ready notification', error, { orderId, driverId })
  }
}

export async function notifyRestaurantDriverAssigned(
  restaurantOwnerId: string,
  orderId: string,
  restaurantName: string,
  driverName: string
): Promise<void> {
  try {
    await createNotification({
      userId: restaurantOwnerId,
      type: 'ORDER_STATUS',
      title: 'Driver Assigned',
      message: `${driverName} has been assigned to deliver order from ${restaurantName}`,
      data: { orderId, restaurantName, driverName },
    })
  } catch (error) {
    logger.error('Failed to create restaurant driver assigned notification', error, { orderId, restaurantOwnerId })
  }
}

export async function notifyRestaurantOrderStatusChange(
  restaurantOwnerId: string,
  orderId: string,
  status: string,
  restaurantName: string
): Promise<void> {
  const statusMessages: Record<string, string> = {
    CONFIRMED: `Order at ${restaurantName} has been confirmed`,
    PREPARING: `Order at ${restaurantName} is now being prepared`,
    READY_FOR_PICKUP: `Order at ${restaurantName} is ready for pickup`,
    OUT_FOR_DELIVERY: `Order at ${restaurantName} is out for delivery`,
    DELIVERED: `Order at ${restaurantName} has been delivered`,
    CANCELLED: `Order at ${restaurantName} has been cancelled`,
  }

  const message = statusMessages[status] || `Order status updated to ${status}`

  try {
    await createNotification({
      userId: restaurantOwnerId,
      type: 'ORDER_STATUS',
      title: 'Order Update',
      message,
      data: { orderId, status, restaurantName },
    })
  } catch (error) {
    logger.error('Failed to create restaurant order status notification', error, { orderId, restaurantOwnerId, status })
  }
}
