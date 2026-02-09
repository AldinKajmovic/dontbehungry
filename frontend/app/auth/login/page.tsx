'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Input, Button, Alert, AuthLayout, Divider, LanguageToggle, ThemeToggle } from '@/components/ui'
import { loginSchema, extractZodErrors, LoginForm } from '@/services/validation'
import { useFormValidation } from '@/hooks/useFormValidation'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'

export default function LoginPage() {
  const [serverError, setServerError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const { t } = useLanguage()

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
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )

  return (
    <AuthLayout
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
      icon={icon}
      iconGradient="primary"
      footerText={t('auth.login.noAccount')}
      footerLinkText={t('common.signUp')}
      footerLinkHref="/auth/register"
      headerRight={<div className="flex items-center gap-2"><ThemeToggle /><LanguageToggle /></div>}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {serverError && <Alert type="error">{serverError}</Alert>}

        <Input
          label={t('auth.login.emailLabel')}
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={getFieldError('email')}
          placeholder={t('auth.login.emailPlaceholder')}
          autoComplete="email"
        />

        <Input
          label={t('auth.login.passwordLabel')}
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={getFieldError('password')}
          placeholder={t('auth.login.passwordPlaceholder')}
          autoComplete="current-password"
          showPasswordToggle
        />

        <div className="flex justify-end">
          <Link href="/auth/forgot-password" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
            {t('auth.login.forgotPassword')}
          </Link>
        </div>

        <Button type="submit" isLoading={isLoading}>
          {isLoading ? t('auth.login.signingIn') : t('common.signIn')}
        </Button>
      </form>

      <Divider text={t('auth.login.continueWith')} />

      {/* Social login buttons */}
      <div className="flex justify-center">
        <Button
          type="button"
          variant="secondary"
          className="flex items-center justify-center gap-2 !w-auto !px-8"
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
      </div>
    </AuthLayout>
  )
}
