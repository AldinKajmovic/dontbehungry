'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export function EmailVerificationBanner() {
  const { user, resendVerification } = useAuth()
  const [isResending, setIsResending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)

  // Don't show if user is verified, not logged in, or dismissed
  if (!user || user.emailVerified || dismissed) {
    return null
  }

  const handleResend = async () => {
    setIsResending(true)
    setMessage(null)

    try {
      await resendVerification()
      setMessage('Verification email sent!')
    } catch {
      setMessage('Failed to send. Try again later.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="bg-yellow-50 border-b border-yellow-200">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-yellow-800">
              <span className="font-medium">Verify your email</span>
              <span className="hidden sm:inline"> to access all features.</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {message && (
              <span className="text-xs text-yellow-700">{message}</span>
            )}
            <button
              onClick={handleResend}
              disabled={isResending}
              className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline disabled:opacity-50"
            >
              {isResending ? 'Sending...' : 'Resend email'}
            </button>
            <Link
              href="/auth/verification-sent"
              className="text-sm font-medium text-yellow-800 hover:text-yellow-900"
            >
              Learn more
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="text-yellow-600 hover:text-yellow-800 p-1"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
