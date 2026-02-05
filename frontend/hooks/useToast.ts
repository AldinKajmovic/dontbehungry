'use client'

import { useContext } from 'react'
import { ToastContext } from '@/providers/ToastProvider'

export function useToast() {
  const context = useContext(ToastContext)

  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  return {
    toast: {
      success: context.success,
      error: context.error,
      info: context.info,
      warning: context.warning,
    },
    toasts: context.toasts,
    removeToast: context.removeToast,
  }
}
