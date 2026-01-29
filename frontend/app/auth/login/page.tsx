'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Input, Button, Alert, AuthLayout } from '@/components/ui'
import { loginSchema, extractZodErrors, LoginForm } from '@/services/validation'
import { useFormValidation } from '@/hooks/useFormValidation'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const [serverError, setServerError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const {
    formData,
    handleChange,
    handleBlur,
    getFieldError,
    setErrors,
    markAllTouched,
  } = useFormValidation<LoginForm>({
    initialValues: { email: '', password: '' },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = loginSchema.safeParse(formData)
    if (!result.success) {
      setErrors(extractZodErrors<LoginForm>(result))
      markAllTouched(['email', 'password'])
      return
    }

    setIsLoading(true)
    setServerError('')

    try {
      await login(formData)
      // Redirect is handled by AuthProvider
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const icon = (
    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue to Glovo Copy"
      icon={icon}
      iconGradient="primary"
      backgroundGradient="orange"
      footerText="Don't have an account?"
      footerLinkText="Sign up"
      footerLinkHref="/auth/register"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {serverError && <Alert type="error">{serverError}</Alert>}

        <Input
          label="Email address"
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={getFieldError('email')}
          placeholder="you@example.com"
          autoComplete="email"
        />

        <Input
          label="Password"
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={getFieldError('password')}
          placeholder="Enter your password"
          autoComplete="current-password"
          showPasswordToggle
        />

        <div className="flex justify-end">
          <Link href="/auth/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 transition-colors">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" isLoading={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">or continue with</span>
        </div>
      </div>

      {/* Social login buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="secondary"
          className="flex items-center justify-center gap-2"
          onClick={() => signIn('google', { callbackUrl: '/auth/callback?success=true' })}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </Button>
        <Button type="button" variant="secondary" className="flex items-center justify-center gap-2" disabled>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          Phone
        </Button>
      </div>
    </AuthLayout>
  )
}
