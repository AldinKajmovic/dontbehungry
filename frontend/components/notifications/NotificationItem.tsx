'use client'

import { Notification, NotificationType } from '@/services/notification'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
}

function getTimeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`
  return date.toLocaleDateString()
}

function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case 'ORDER_NEW':
      return '🛒'
    case 'ORDER_STATUS':
      return '📦'
    case 'DELIVERY_ASSIGNED':
      return '🚗'
    case 'DELIVERY_READY':
      return '✅'
    default:
      return '🔔'
  }
}

export function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(notification.id)
  }

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!notification.isRead) {
      onMarkAsRead(notification.id)
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`
        relative flex items-start gap-3 p-3 cursor-pointer transition-colors
        ${notification.isRead ? 'bg-white dark:bg-neutral-900' : 'bg-blue-50 dark:bg-blue-950/30'}
        hover:bg-gray-50 dark:hover:bg-neutral-800 border-b border-gray-100 dark:border-neutral-800 last:border-b-0
      `}
    >
      {/* Icon */}
      <div className="flex-shrink-0 text-xl">
        {getNotificationIcon(notification.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${notification.isRead ? 'text-gray-700 dark:text-neutral-300' : 'text-gray-900 dark:text-white font-medium'}`}>
          {notification.title}
        </p>
        <p className="text-sm text-gray-600 dark:text-neutral-400 mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 dark:text-neutral-500 mt-1">
          {getTimeAgo(notification.createdAt)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center gap-1">
        {!notification.isRead && (
          <button
            onClick={handleMarkAsRead}
            className="p-1 text-gray-400 dark:text-neutral-500 hover:text-green-500 transition-colors"
            title="Mark as read"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        )}
        <button
          onClick={handleDelete}
          className="p-1 text-gray-400 dark:text-neutral-500 hover:text-red-500 transition-colors"
          title="Delete notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r" />
      )}
    </div>
  )
}
