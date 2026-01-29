'use client'

import { useState } from 'react'
import { CountryCode } from 'libphonenumber-js'
import { Input, Button, PhoneInput, Alert, PasswordStrength, AuthLayout } from '@/components/ui'
import { registerSchema, extractZodErrors, formatPhoneE164, RegisterForm } from '@/services/validation'
import { useFormValidation } from '@/hooks/useFormValidation'
import { useAuth } from '@/hooks/useAuth'

export default function RegisterPage() {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>('US')
  const [serverError, setServerError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { register } = useAuth()

  const {
    formData,
    handleChange,
    handleBlur,
    getFieldError,
    setFieldValue,
    setFieldTouched,
    validateField,
    setErrors,
    markAllTouched,
  } = useFormValidation<RegisterForm>({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
    phoneFields: [{ field: 'phone', countryState: () => selectedCountry }],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = registerSchema.safeParse(formData)
    if (!result.success) {
      setErrors(extractZodErrors<RegisterForm>(result))
      markAllTouched(['firstName', 'lastName', 'email', 'phone', 'password', 'confirmPassword'])
      return
    }

    setIsLoading(true)
    setServerError('')

    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formatPhoneE164(formData.phone || '', selectedCountry),
        password: formData.password,
      })
      // Redirect is handled by AuthProvider
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const icon = (
    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  )

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join Glovo Copy and start ordering"
      icon={icon}
      iconGradient="secondary"
      backgroundGradient="green"
      footerText="Already have an account?"
      footerLinkText="Sign in"
      footerLinkHref="/auth/login"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && <Alert type="error">{serverError}</Alert>}

        {/* Name fields */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First name"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            onBlur={handleBlur}
            error={getFieldError('firstName')}
            placeholder="John"
            autoComplete="given-name"
          />
          <Input
            label="Last name"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            onBlur={handleBlur}
            error={getFieldError('lastName')}
            placeholder="Doe"
            autoComplete="family-name"
          />
        </div>

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

        <PhoneInput
          label="Phone number"
          hint="(optional)"
          value={formData.phone || ''}
          onChange={(value) => setFieldValue('phone', value)}
          onBlur={() => {
            setFieldTouched('phone')
            validateField('phone')
          }}
          onCountryChange={setSelectedCountry}
          selectedCountry={selectedCountry}
          error={getFieldError('phone')}
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
          placeholder="Create a password"
          autoComplete="new-password"
          showPasswordToggle
        />
        {formData.password && !getFieldError('password') && (
          <PasswordStrength password={formData.password} />
        )}

        <Input
          label="Confirm password"
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          error={getFieldError('confirmPassword')}
          placeholder="Confirm your password"
          autoComplete="new-password"
          showPasswordToggle
        />

        <Button type="submit" isLoading={isLoading} className="mt-2">
          {isLoading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">or sign up with</span>
        </div>
      </div>

      {/* Social login buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button type="button" variant="secondary" className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </Button>
        <Button type="button" variant="secondary" className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          Phone
        </Button>
      </div>
    </AuthLayout>
  )
}
