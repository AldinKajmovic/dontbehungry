'use client'

import { useEffect, useRef } from 'react'
import { useLanguage } from '@/hooks/useLanguage'

interface DriverOrderQueueBadgeProps {
  orderCount: number
  onClick: () => void
}

export default function DriverOrderQueueBadge({
  orderCount,
  onClick,
}: DriverOrderQueueBadgeProps) {
  const { t } = useLanguage()
  const prevCountRef = useRef(orderCount)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Pulse animation when a new order arrives
  useEffect(() => {
    if (orderCount > prevCountRef.current && buttonRef.current) {
      buttonRef.current.classList.add('animate-bounce')
      const timer = setTimeout(() => {
        buttonRef.current?.classList.remove('animate-bounce')
      }, 1000)
      return () => clearTimeout(timer)
    }
    prevCountRef.current = orderCount
  }, [orderCount])

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg transition-transform hover:scale-110 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
      aria-label={t('driver.orderQueue.title')}
    >
      {/* Delivery truck icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
        />
      </svg>

      {/* Badge counter */}
      {orderCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
          {orderCount > 9 ? '9+' : orderCount}
        </span>
      )}
    </button>
  )
}
