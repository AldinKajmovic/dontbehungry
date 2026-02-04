'use client'

import { useState } from 'react'
import { AuthLayout, Input, Button, Alert, StatusMessage, LanguageToggle } from '@/components/ui'
import { authService } from '@/services/auth'

const EmailIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
  </svg>
)

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await authService.forgotPassword(email)
      setIsSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
    </svg>
  )

  if (isSubmitted) {
    return (
      <AuthLayout
        title="Check Your Email"
        subtitle="We've sent you a password reset link"
        icon={icon}
        backgroundGradient="orange"
        headerRight={<LanguageToggle />}
      >
        <StatusMessage
          status="success"
          icon={EmailIcon}
          actions={[{ label: 'Back to Login', href: '/auth/login', variant: 'secondary' }]}
        >
          <p className="mb-2">
            If an account with that email exists, we&apos;ve sent a password reset link to:
          </p>
          <p className="font-medium text-gray-900 mb-4">{email}</p>
          <p className="text-sm text-gray-500">
            The link will expire in 1 hour. Check your spam folder if you don&apos;t see it.
          </p>
        </StatusMessage>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Forgot Password?"
      subtitle="Enter your email to reset your password"
      icon={icon}
      backgroundGradient="orange"
      footerText="Remember your password?"
      footerLinkText="Sign in"
      footerLinkHref="/auth/login"
      headerRight={<LanguageToggle />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error">{error}</Alert>}

        <Input
          label="Email"
          type="email"
          name="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />

        <Button type="submit" isLoading={isLoading} disabled={!email || isLoading} className="w-full">
          Send Reset Link
        </Button>
      </form>
    </AuthLayout>
  )
}
