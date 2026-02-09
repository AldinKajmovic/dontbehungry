'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CountryCode } from 'libphonenumber-js'
import { Input, Button, PhoneInput, Alert, PasswordStrength, AuthLayout, LanguageToggle, ThemeToggle, AddressAutocomplete } from '@/components/ui'
import { registerRestaurantSchema, extractZodErrors, formatPhoneE164, RegisterRestaurantForm } from '@/services/validation'
import { useFormValidation } from '@/hooks/useFormValidation'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'

export default function RegisterRestaurantPage() {
  const [step, setStep] = useState(1)
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>('US')
  const [restaurantCountry, setRestaurantCountry] = useState<CountryCode>('US')
  const [serverError, setServerError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const { registerRestaurant } = useAuth()
  const { t } = useLanguage()

  const {
    formData,
    handleChange,
    handleBlur,
    getFieldError,
    setFieldValue,
    setFieldTouched,
    validateField,
    validateFields,
    setErrors,
  } = useFormValidation<RegisterRestaurantForm>({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      restaurantName: '',
      restaurantDescription: '',
      restaurantPhone: '',
      restaurantEmail: '',
      address: '',
      city: '',
      country: '',
      postalCode: '',
      minOrderAmount: '',
      deliveryFee: '',
    },
    phoneFields: [
      { field: 'phone', countryState: () => selectedCountry },
      { field: 'restaurantPhone', countryState: () => restaurantCountry },
    ],
  })

  const step1Fields: (keyof RegisterRestaurantForm)[] = ['firstName', 'lastName', 'email', 'password', 'confirmPassword']
  const step2Fields: (keyof RegisterRestaurantForm)[] = ['restaurantName', 'address', 'city', 'country']

  const handleNext = () => {
    if (validateFields(step1Fields)) {
      setStep(2)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateFields(step2Fields)) return

    const result = registerRestaurantSchema.safeParse(formData)
    if (!result.success) {
      setErrors(extractZodErrors<RegisterRestaurantForm>(result))
      return
    }

    setIsLoading(true)
    setServerError('')

    try {
      await registerRestaurant({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formatPhoneE164(formData.phone, selectedCountry) || formData.phone,
        password: formData.password,
        restaurantName: formData.restaurantName,
        restaurantDescription: formData.restaurantDescription || undefined,
        restaurantPhone: formatPhoneE164(formData.restaurantPhone || '', restaurantCountry),
        restaurantEmail: formData.restaurantEmail || undefined,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        postalCode: formData.postalCode || undefined,
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : undefined,
        deliveryFee: formData.deliveryFee ? parseFloat(formData.deliveryFee) : undefined,
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
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  )

  return (
    <AuthLayout
      title={t('auth.registerRestaurant.title')}
      subtitle={t('auth.registerRestaurant.subtitle')}
      icon={icon}
      iconGradient="primary"
      footerText={t('auth.registerRestaurant.hasAccount')}
      footerLinkText={t('common.signIn')}
      footerLinkHref="/auth/login"
      headerRight={<div className="flex items-center gap-2"><ThemeToggle /><LanguageToggle /></div>}
    >
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-neutral-700 text-gray-500 dark:text-neutral-400'}`}>
          1
        </div>
        <div className={`w-16 h-1 rounded ${step >= 2 ? 'bg-primary-500' : 'bg-gray-200 dark:bg-neutral-700'}`} />
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-neutral-700 text-gray-500 dark:text-neutral-400'}`}>
          2
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && <Alert type="error">{serverError}</Alert>}

        {step === 1 && (
          <>
            <p className="text-sm text-gray-600 dark:text-neutral-400 font-medium mb-4">{t('auth.registerRestaurant.ownerInfo')}</p>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t('auth.registerRestaurant.firstName')}
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
                label={t('auth.registerRestaurant.lastName')}
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
              label={t('auth.registerRestaurant.email')}
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
              label={t('auth.registerRestaurant.phone')}
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
              label={t('auth.registerRestaurant.password')}
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={getFieldError('password')}
              placeholder={t('auth.registerRestaurant.passwordPlaceholder')}
              autoComplete="new-password"
              showPasswordToggle
            />
            {formData.password && !getFieldError('password') && (
              <PasswordStrength password={formData.password} />
            )}

            <Input
              label={t('auth.registerRestaurant.confirmPassword')}
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              error={getFieldError('confirmPassword')}
              placeholder={t('auth.registerRestaurant.confirmPasswordPlaceholder')}
              autoComplete="new-password"
              showPasswordToggle
            />

            <Button type="button" onClick={handleNext} className="mt-2">
              {t('auth.registerRestaurant.continue')}
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-sm text-gray-600 dark:text-neutral-400 font-medium mb-4">{t('auth.registerRestaurant.restaurantInfo')}</p>

            <Input
              label={t('auth.registerRestaurant.restaurantName')}
              id="restaurantName"
              name="restaurantName"
              value={formData.restaurantName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={getFieldError('restaurantName')}
              placeholder={t('auth.registerRestaurant.restaurantNamePlaceholder')}
            />

            <div>
              <label htmlFor="restaurantDescription" className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                {t('auth.registerRestaurant.description')} <span className="text-gray-400 dark:text-neutral-500">({t('common.optional')})</span>
              </label>
              <textarea
                id="restaurantDescription"
                name="restaurantDescription"
                value={formData.restaurantDescription}
                onChange={handleChange}
                onBlur={handleBlur}
                className="input-field min-h-[80px] resize-none"
                placeholder={t('auth.registerRestaurant.descriptionPlaceholder')}
                maxLength={500}
              />
            </div>

            <PhoneInput
              label={t('auth.registerRestaurant.restaurantPhone')}
              hint={`(${t('common.optional')})`}
              value={formData.restaurantPhone || ''}
              onChange={(value) => setFieldValue('restaurantPhone', value)}
              onBlur={() => {
                setFieldTouched('restaurantPhone')
                validateField('restaurantPhone')
              }}
              onCountryChange={setRestaurantCountry}
              selectedCountry={restaurantCountry}
              error={getFieldError('restaurantPhone')}
            />

            <Input
              label={t('auth.registerRestaurant.restaurantEmail')}
              hint={`(${t('common.optional')})`}
              type="email"
              id="restaurantEmail"
              name="restaurantEmail"
              value={formData.restaurantEmail}
              onChange={handleChange}
              onBlur={handleBlur}
              error={getFieldError('restaurantEmail')}
              placeholder="contact@restaurant.com"
            />

            <p className="text-sm text-gray-600 dark:text-neutral-400 font-medium mt-6 mb-4">{t('auth.registerRestaurant.deliverySettings')}</p>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t('auth.registerRestaurant.minOrderAmount')}
                hint={`(${t('common.optional')})`}
                type="number"
                step="0.01"
                min="0"
                id="minOrderAmount"
                name="minOrderAmount"
                value={formData.minOrderAmount}
                onChange={handleChange}
                onBlur={handleBlur}
                error={getFieldError('minOrderAmount')}
                placeholder="0.00"
              />
              <Input
                label={t('auth.registerRestaurant.deliveryFee')}
                hint={`(${t('common.optional')})`}
                type="number"
                step="0.01"
                min="0"
                id="deliveryFee"
                name="deliveryFee"
                value={formData.deliveryFee}
                onChange={handleChange}
                onBlur={handleBlur}
                error={getFieldError('deliveryFee')}
                placeholder="0.00"
              />
            </div>

            <p className="text-sm text-gray-600 dark:text-neutral-400 font-medium mt-6 mb-4">{t('auth.registerRestaurant.restaurantAddress')}</p>

            <AddressAutocomplete
              label={t('address.streetAddress')}
              placeholder={t('address.searchPlaceholder')}
              onAddressSelect={(addr) => {
                setFieldValue('address', addr.address)
                setFieldValue('city', addr.city)
                setFieldValue('country', addr.country)
                setFieldValue('postalCode', addr.postalCode)
                setCoordinates({ lat: addr.latitude, lng: addr.longitude })
              }}
              height="150px"
            />

            <div className="flex gap-3 mt-2">
              <Button type="button" variant="secondary" onClick={() => setStep(1)} className="flex-1">
                {t('auth.registerRestaurant.back')}
              </Button>
              <Button type="submit" isLoading={isLoading} className="flex-1">
                {isLoading ? t('auth.registerRestaurant.creating') : t('auth.registerRestaurant.createRestaurant')}
              </Button>
            </div>
          </>
        )}
      </form>

      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-neutral-700">
        <p className="text-center text-sm text-gray-500 dark:text-neutral-400">
          {t('auth.registerRestaurant.wantToOrder')}{' '}
          <Link href="/auth/register" className="link">
            {t('auth.registerRestaurant.registerAsCustomer')}
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
