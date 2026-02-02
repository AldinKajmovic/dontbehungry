export type NotificationType = 'ORDER_NEW' | 'ORDER_STATUS' | 'DELIVERY_ASSIGNED' | 'DELIVERY_READY'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  data: Record<string, unknown> | null
  isRead: boolean
  createdAt: string
}

export interface NotificationsListResponse {
  notifications: Notification[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface UnreadCountResponse {
  count: number
}

export interface MarkAsReadResponse {
  message: string
  notification: Notification
}

export interface MarkAllAsReadResponse {
  message: string
  count: number
}

export interface DeleteNotificationResponse {
  message: string
}
