'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'

export function GuestBanner() {
  const { isAuthenticated, isLoading } = useAuth()
  const { t } = useLanguage()
  const [dismissed, setDismissed] = useState(false)

  // Don't show if user is authenticated, loading, or dismissed
  if (isLoading || isAuthenticated || dismissed) {
    return null
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-amber-600 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-amber-800">
              <span className="font-medium">{t('guest.banner')}</span>
              <span className="hidden sm:inline">
                {' '}
                — {t('guest.bannerSubtitle')}
              </span>
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-amber-600 hover:text-amber-800 p-1"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
