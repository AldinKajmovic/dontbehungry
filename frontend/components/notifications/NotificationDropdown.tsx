'use client'

import { useRef, useEffect, RefObject } from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import { NotificationItem } from './NotificationItem'

interface NotificationDropdownProps {
  isOpen: boolean
  onClose: () => void
  containerRef?: RefObject<HTMLDivElement | null>
}

export function NotificationDropdown({ isOpen, onClose, containerRef }: NotificationDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
  } = useNotifications()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Use containerRef if provided (includes bell button), otherwise just dropdownRef
      const refToCheck = containerRef?.current || dropdownRef.current
      if (refToCheck && !refToCheck.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose, containerRef])

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">
          Notifications {unreadCount > 0 && `(${unreadCount})`}
        </h3>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <div className="text-4xl mb-2">🔔</div>
            <p className="text-sm text-gray-500">No notifications yet</p>
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))}

            {/* Load more */}
            {hasMore && (
              <div className="px-4 py-3 border-t border-gray-100">
                <button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                >
                  {isLoading ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
