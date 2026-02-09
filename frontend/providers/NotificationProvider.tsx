'use client'

import { createContext, useCallback, useEffect, useState, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useSocket } from './SocketProvider'
import { useAuth } from '@/hooks/useAuth'
import { notificationService, Notification } from '@/services/notification'
import { logger } from '@/utils/logger'

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  hasMore: boolean
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationProviderProps {
  children: ReactNode
}

const PAGE_SIZE = 5
const SKIP_PATHS = ['/auth/']

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const { socket, isConnected } = useSocket()
  const { isAuthenticated, user, isLoading: authLoading } = useAuth()
  const pathname = usePathname()
  const isAuthPage = SKIP_PATHS.some(path => pathname?.startsWith(path))

  const shouldLoadNotifications = !isAuthPage && !authLoading && isAuthenticated && user && user.role !== 'ADMIN'

  const fetchNotifications = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!shouldLoadNotifications) return

    setIsLoading(true)
    try {
      const response = await notificationService.getNotifications(pageNum, PAGE_SIZE)

      if (append) {
        setNotifications((prev) => [...prev, ...response.notifications])
      } else {
        setNotifications(response.notifications)
      }

      setHasMore(response.pagination.page < response.pagination.totalPages)
      setPage(pageNum)
    } catch (error) {
      logger.error('Failed to fetch notifications', error)
    } finally {
      setIsLoading(false)
    }
  }, [shouldLoadNotifications])

  const fetchUnreadCount = useCallback(async () => {
    if (!shouldLoadNotifications) return

    try {
      const response = await notificationService.getUnreadCount()
      setUnreadCount(response.count)
    } catch (error) {
      logger.error('Failed to fetch unread count', error)
    }
  }, [shouldLoadNotifications])


  useEffect(() => {
    if (shouldLoadNotifications) {
      fetchNotifications(1)
      fetchUnreadCount()
    } else {
      setNotifications([])
      setUnreadCount(0)
      setPage(1)
      setHasMore(true)
    }
  }, [shouldLoadNotifications, fetchNotifications, fetchUnreadCount])

  useEffect(() => {
    if (!socket || !isConnected) return

    const handleNotification = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev])
      setUnreadCount((prev) => prev + 1)
    }

    socket.on('notification', handleNotification)

    return () => {
      socket.off('notification', handleNotification)
    }
  }, [socket, isConnected])

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationService.markAsRead(id)

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )

      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      logger.error('Failed to mark notification as read', error)
      throw error
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead()

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      logger.error('Failed to mark all notifications as read', error)
      throw error
    }
  }, [])

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const notification = notifications.find((n) => n.id === id)

      await notificationService.deleteNotification(id)

      setNotifications((prev) => prev.filter((n) => n.id !== id))

      if (notification && !notification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      logger.error('Failed to delete notification', error)
      throw error
    }
  }, [notifications])

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return
    await fetchNotifications(page + 1, true)
  }, [isLoading, hasMore, page, fetchNotifications])

  const refresh = useCallback(async () => {
    await Promise.all([fetchNotifications(1), fetchUnreadCount()])
  }, [fetchNotifications, fetchUnreadCount])

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
    refresh,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}
