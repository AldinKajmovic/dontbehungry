'use client'

import { useContext } from 'react'
import { NotificationContext } from '@/providers/NotificationProvider'

const defaultContext = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  hasMore: false,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  deleteNotification: async () => {},
  loadMore: async () => {},
  refresh: async () => {},
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  // Return safe defaults if context is undefined 
  if (context === undefined) {
    return defaultContext
  }
  return context
}
