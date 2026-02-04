'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CountryCode } from 'libphonenumber-js'
import { Input, Button, PhoneInput, Alert, AuthLayout, LanguageToggle } from '@/components/ui'
import { registerSchema, extractZodErrors, formatPhoneE164, RegisterForm } from '@/services/validation'
import { useFormValidation } from '@/hooks/useFormValidation'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'

export default function RegisterPage() {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>('US')
  const [serverError, setServerError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { register } = useAuth()
  const { t } = useLanguage()

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
      address: '',
      city: '',
      country: '',
    },
    phoneFields: [{ field: 'phone', countryState: () => selectedCountry }],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = registerSchema.safeParse(formData)
    if (!result.success) {
      setErrors(extractZodErrors<RegisterForm>(result))
      markAllTouched(['firstName', 'lastName', 'email', 'phone', 'password', 'confirmPassword', 'address', 'city', 'country'])
      return
    }

    // Validate address fields if any are filled
    if (formData.address || formData.city || formData.country) {
      if (!formData.address || !formData.city || !formData.country) {
        setServerError(t('address.requiredFields'))
        return
      }
    }

    setIsLoading(true)
    setServerError('')

    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formatPhoneE164(formData.phone, selectedCountry) || formData.phone,
        password: formData.password,
        address: formData.address || undefined,
        city: formData.city || undefined,
        country: formData.country || undefined,
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
      title={t('auth.register.title')}
      subtitle={t('auth.register.subtitle')}
      icon={icon}
      iconGradient="secondary"
      backgroundGradient="green"
      footerText={t('auth.register.hasAccount')}
      footerLinkText={t('common.signIn')}
      footerLinkHref="/auth/login"
      headerRight={<LanguageToggle />}
    >
      {/* Restaurant Owner Banner */}
      <Link
        href="/auth/register-restaurant"
        className="block mb-6 p-4 bg-gradient-to-r from-secondary-50 to-secondary-100 border border-secondary-200 rounded-xl hover:from-secondary-100 hover:to-secondary-200 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-medium text-secondary-900">{t('auth.register.restaurantOwner')}</p>
            <p className="text-sm text-secondary-700">{t('auth.register.registerRestaurant')}</p>
          </div>
          <svg className="w-5 h-5 text-secondary-400 group-hover:text-secondary-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>

      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && <Alert type="error">{serverError}</Alert>}

        {/* Name fields */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t('auth.register.firstNameLabel')}
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            onBlur={handleBlur}
            error={getFieldError('firstName')}
            placeholder={t('auth.register.firstNamePlaceholder')}
            autoComplete="given-name"
          />
          <Input
            label={t('auth.register.lastNameLabel')}
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            onBlur={handleBlur}
            error={getFieldError('lastName')}
            placeholder={t('auth.register.lastNamePlaceholder')}
            autoComplete="family-name"
          />
        </div>

        <Input
          label={t('auth.register.emailLabel')}
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={getFieldError('email')}
          placeholder={t('auth.register.emailPlaceholder')}
          autoComplete="email"
        />

        <PhoneInput
          label={t('auth.register.phoneLabel')}
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
          label={t('auth.register.passwordLabel')}
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={getFieldError('password')}
          placeholder={t('auth.register.passwordPlaceholder')}
          autoComplete="new-password"
          showPasswordToggle
        />

        <Input
          label={t('auth.register.confirmPasswordLabel')}
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          error={getFieldError('confirmPassword')}
          placeholder={t('auth.register.confirmPasswordPlaceholder')}
          autoComplete="new-password"
          showPasswordToggle
        />

        {/* Delivery Address */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-3">{t('auth.register.deliveryAddress')}</p>
          <div className="space-y-3">
            <Input
              label={t('auth.register.streetAddressLabel')}
              id="address"
              name="address"
              value={formData.address || ''}
              onChange={handleChange}
              onBlur={handleBlur}
              error={getFieldError('address')}
              placeholder={t('auth.register.streetAddressPlaceholder')}
              autoComplete="street-address"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t('auth.register.cityLabel')}
                id="city"
                name="city"
                value={formData.city || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                error={getFieldError('city')}
                placeholder={t('auth.register.cityPlaceholder')}
                autoComplete="address-level2"
              />
              <Input
                label={t('auth.register.countryLabel')}
                id="country"
                name="country"
                value={formData.country || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                error={getFieldError('country')}
                placeholder={t('auth.register.countryPlaceholder')}
                autoComplete="country-name"
              />
            </div>
          </div>
        </div>

        <Button type="submit" isLoading={isLoading} className="mt-2">
          {isLoading ? t('auth.register.creatingAccount') : t('auth.register.createAccount')}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">{t('auth.register.signUpWith')}</span>
        </div>
      </div>

      {/* Social login buttons */}
      <div className="flex justify-center">
        <Button type="button" variant="secondary" className="flex items-center justify-center gap-2 !w-auto !px-8">
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
