import api from '../api'
import {
  NotificationsListResponse,
  UnreadCountResponse,
  MarkAsReadResponse,
  MarkAllAsReadResponse,
  DeleteNotificationResponse,
} from './types'

const BASE_PATH = '/api/notifications'

class NotificationService {
  async getNotifications(page: number = 1, limit: number = 5): Promise<NotificationsListResponse> {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('limit', limit.toString())

    const response = await api.get<NotificationsListResponse>(`${BASE_PATH}?${params.toString()}`)
    return response.data
  }

  async getUnreadCount(): Promise<UnreadCountResponse> {
    const response = await api.get<UnreadCountResponse>(`${BASE_PATH}/unread-count`)
    return response.data
  }

  async markAsRead(id: string): Promise<MarkAsReadResponse> {
    const response = await api.patch<MarkAsReadResponse>(`${BASE_PATH}/${id}/read`)
    return response.data
  }

  async markAllAsRead(): Promise<MarkAllAsReadResponse> {
    const response = await api.patch<MarkAllAsReadResponse>(`${BASE_PATH}/read-all`)
    return response.data
  }

  async deleteNotification(id: string): Promise<DeleteNotificationResponse> {
    const response = await api.delete<DeleteNotificationResponse>(`${BASE_PATH}/${id}`)
    return response.data
  }
}

export const notificationService = new NotificationService()
