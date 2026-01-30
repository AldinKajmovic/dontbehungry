'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { Button } from './Button'

export interface StatusAction {
  label: string
  onClick?: () => void
  href?: string
  variant?: 'primary' | 'secondary'
  loading?: boolean
}

interface StatusMessageProps {
  status: 'success' | 'error' | 'loading' | 'info'
  icon?: ReactNode
  title?: string
  children?: ReactNode
  actions?: StatusAction[]
  className?: string
}

const bgColors = {
  success: 'bg-green-100',
  error: 'bg-red-100',
  loading: 'bg-primary-100',
  info: 'bg-blue-100',
}

const textColors = {
  success: 'text-green-600',
  error: 'text-red-600',
  loading: 'text-primary-600',
  info: 'text-blue-600',
}

const defaultIcons = {
  success: (
    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  ),
  info: (
    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  ),
}

export function StatusMessage({
  status,
  icon,
  title,
  children,
  actions = [],
  className = '',
}: StatusMessageProps) {
  const displayIcon = icon || defaultIcons[status as keyof typeof defaultIcons]

  return (
    <div className={`flex flex-col items-center py-6 ${className}`}>
      {status === 'loading' ? (
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4" />
      ) : displayIcon ? (
        <div className={`w-16 h-16 ${bgColors[status]} rounded-full flex items-center justify-center mb-4`}>
          <div className={textColors[status]}>{displayIcon}</div>
        </div>
      ) : null}

      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">{title}</h3>
      )}

      {children && (
        <div className="text-center text-gray-600 mb-6">{children}</div>
      )}

      {actions.length > 0 && (
        <div className="w-full space-y-2">
          {actions.map((action) =>
            action.href ? (
              <Link key={action.label} href={action.href} className="block w-full">
                <Button
                  variant={action.variant || 'primary'}
                  className="w-full"
                  isLoading={action.loading}
                >
                  {action.label}
                </Button>
              </Link>
            ) : (
              <Button
                key={action.label}
                variant={action.variant || 'primary'}
                className="w-full"
                onClick={action.onClick}
                isLoading={action.loading}
              >
                {action.label}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  )
}
