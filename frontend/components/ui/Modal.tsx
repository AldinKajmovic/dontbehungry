'use client'

import { ReactNode, useEffect } from 'react'
import { Button } from './Button'

export interface ModalAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  loading?: boolean
  disabled?: boolean
}

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  icon?: ReactNode
  iconColor?: 'primary' | 'red' | 'green' | 'blue' | 'yellow'
  children: ReactNode
  actions?: ModalAction[]
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const iconBgColors = {
  primary: 'bg-primary-100',
  red: 'bg-red-100',
  green: 'bg-green-100',
  blue: 'bg-blue-100',
  yellow: 'bg-yellow-100',
}

const iconTextColors = {
  primary: 'text-primary-600',
  red: 'text-red-600',
  green: 'text-green-600',
  blue: 'text-blue-600',
  yellow: 'text-yellow-600',
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

export function Modal({
  isOpen,
  onClose,
  title,
  icon,
  iconColor = 'primary',
  children,
  actions = [],
  size = 'md',
  className = '',
}: ModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={`relative bg-white rounded-xl shadow-xl ${sizeClasses[size]} w-full mx-4 p-6 max-h-[90vh] overflow-y-auto ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          {icon && (
            <div className={`w-10 h-10 ${iconBgColors[iconColor]} rounded-full flex items-center justify-center`}>
              <div className={iconTextColors[iconColor]}>{icon}</div>
            </div>
          )}
          <h3 id="modal-title" className="text-lg font-semibold text-gray-900">
            {title}
          </h3>
        </div>

        {/* Content */}
        {children}

        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex gap-3 mt-6">
            {actions.map((action) => {
              if (action.variant === 'danger') {
                return (
                  <button
                    key={action.label}
                    type="button"
                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                    onClick={action.onClick}
                    disabled={action.loading || action.disabled}
                  >
                    {action.loading ? 'Loading...' : action.label}
                  </button>
                )
              }
              return (
                <Button
                  key={action.label}
                  type="button"
                  variant={action.variant === 'secondary' ? 'secondary' : 'primary'}
                  className="flex-1"
                  onClick={action.onClick}
                  isLoading={action.loading}
                  disabled={action.disabled}
                >
                  {action.label}
                </Button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
