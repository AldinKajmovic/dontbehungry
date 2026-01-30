'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthLayout } from '@/components/ui/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { useAuth } from '@/hooks/useAuth'

export default function VerificationSentPage() {
  const [isResending, setIsResending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const router = useRouter()
  const { user, resendVerification, logout, isAuthenticated } = useAuth()

  const handleResend = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    setIsResending(true)
    setMessage(null)

    try {
      await resendVerification()
      setMessage({ type: 'success', text: 'Verification email sent! Please check your inbox.' })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to resend verification email',
      })
    } finally {
      setIsResending(false)
    }
  }

  const handleLogout = async () => {
    await logout()
  }

  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
    </svg>
  )

  return (
    <AuthLayout
      title="Check Your Email"
      subtitle="We've sent you a verification link"
      icon={icon}
      backgroundGradient="green"
    >
      <div className="flex flex-col items-center py-6">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
        </div>

        {user && (
          <p className="text-gray-600 text-center mb-2">
            We&apos;ve sent a verification email to:
          </p>
        )}

        {user && (
          <p className="font-medium text-gray-900 mb-4">
            {user.email}
          </p>
        )}

        <p className="text-sm text-gray-500 text-center mb-6">
          Click the link in the email to verify your account. The link will expire in 24 hours.
        </p>

        {message && (
          <Alert type={message.type}>
            {message.text}
          </Alert>
        )}

        <div className="w-full space-y-3">
          {isAuthenticated && (
            <Button
              onClick={() => router.push('/')}
              className="w-full"
            >
              Continue to App
            </Button>
          )}

          <Button
            variant="secondary"
            onClick={handleResend}
            isLoading={isResending}
            disabled={isResending}
            className="w-full"
          >
            Resend Verification Email
          </Button>

          {isAuthenticated && (
            <Button
              variant="secondary"
              onClick={handleLogout}
              className="w-full"
            >
              Sign Out
            </Button>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          Didn&apos;t receive the email? Check your spam folder or request a new one.
        </p>
      </div>
    </AuthLayout>
  )
}
