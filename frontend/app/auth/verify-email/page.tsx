'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AuthLayout } from '@/components/ui/AuthLayout'
import { Button } from '@/components/ui/Button'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { authService } from '@/services/auth'
import { useAuth } from '@/hooks/useAuth'

function VerifyEmailContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const { refreshUser } = useAuth()

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMessage('No verification token provided')
      return
    }

    const verifyEmail = async () => {
      try {
        await authService.verifyEmail(token)
        setStatus('success')
        await refreshUser()
      } catch (error) {
        setStatus('error')
        setErrorMessage(error instanceof Error ? error.message : 'Verification failed')
      }
    }

    verifyEmail()
  }, [token, refreshUser])

  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
    </svg>
  )

  if (status === 'loading') {
    return (
      <AuthLayout
        title="Verifying Email"
        subtitle="Please wait while we verify your email address"
        icon={icon}
        headerRight={<div className="flex items-center gap-2"><ThemeToggle /><LanguageToggle /></div>}
      >
        <div className="flex flex-col items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
          <p className="mt-4 text-gray-600 dark:text-neutral-400">Verifying your email...</p>
        </div>
      </AuthLayout>
    )
  }

  if (status === 'success') {
    return (
      <AuthLayout
        title="Email Verified!"
        subtitle="Your email has been successfully verified"
        icon={icon}
        headerRight={<div className="flex items-center gap-2"><ThemeToggle /><LanguageToggle /></div>}
      >
        <div className="flex flex-col items-center py-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-neutral-400 text-center mb-6">
            Thank you for verifying your email. You can now access all features.
          </p>
          <Button onClick={() => router.push('/')} className="w-full">
            Go to Home
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Verification Failed"
      subtitle="We couldn't verify your email"
      icon={icon}
      headerRight={<div className="flex items-center gap-2"><ThemeToggle /><LanguageToggle /></div>}
    >
      <div className="flex flex-col items-center py-8">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-gray-600 dark:text-neutral-400 text-center mb-2">
          {errorMessage || 'The verification link may be invalid or expired.'}
        </p>
        <p className="text-sm text-gray-500 dark:text-neutral-400 text-center mb-6">
          Please request a new verification email.
        </p>
        <Link href="/auth/login" className="w-full">
          <Button variant="secondary" className="w-full">
            Go to Login
          </Button>
        </Link>
      </div>
    </AuthLayout>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
