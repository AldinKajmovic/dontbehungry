'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CountryCode } from 'libphonenumber-js'
import { Input, Button, PhoneInput, Alert, PasswordStrength, AuthLayout } from '@/components/ui'
import { registerRestaurantSchema, extractZodErrors, formatPhoneE164, RegisterRestaurantForm } from '@/services/validation'
import { useFormValidation } from '@/hooks/useFormValidation'
import { useAuth } from '@/hooks/useAuth'

export default function RegisterRestaurantPage() {
  const [step, setStep] = useState(1)
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>('US')
  const [restaurantCountry, setRestaurantCountry] = useState<CountryCode>('US')
  const [serverError, setServerError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { registerRestaurant } = useAuth()

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
        phone: formatPhoneE164(formData.phone || '', selectedCountry),
        password: formData.password,
        restaurantName: formData.restaurantName,
        restaurantDescription: formData.restaurantDescription || undefined,
        restaurantPhone: formatPhoneE164(formData.restaurantPhone || '', restaurantCountry),
        restaurantEmail: formData.restaurantEmail || undefined,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        postalCode: formData.postalCode || undefined,
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
      title="Register your restaurant"
      subtitle="Join Glovo Copy and reach more customers"
      icon={icon}
      iconGradient="secondary"
      backgroundGradient="green"
      footerText="Already have an account?"
      footerLinkText="Sign in"
      footerLinkHref="/auth/login"
    >
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? 'bg-secondary-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
          1
        </div>
        <div className={`w-16 h-1 rounded ${step >= 2 ? 'bg-secondary-500' : 'bg-gray-200'}`} />
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? 'bg-secondary-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
          2
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && <Alert type="error">{serverError}</Alert>}

        {step === 1 && (
          <>
            <p className="text-sm text-gray-600 font-medium mb-4">Owner Information</p>

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

            <Button type="button" onClick={handleNext} className="mt-2">
              Continue
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-sm text-gray-600 font-medium mb-4">Restaurant Information</p>

            <Input
              label="Restaurant name"
              id="restaurantName"
              name="restaurantName"
              value={formData.restaurantName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={getFieldError('restaurantName')}
              placeholder="My Awesome Restaurant"
            />

            <div>
              <label htmlFor="restaurantDescription" className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                id="restaurantDescription"
                name="restaurantDescription"
                value={formData.restaurantDescription}
                onChange={handleChange}
                onBlur={handleBlur}
                className="input-field min-h-[80px] resize-none"
                placeholder="Tell customers about your restaurant..."
                maxLength={500}
              />
            </div>

            <PhoneInput
              label="Restaurant phone"
              hint="(optional)"
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
              label="Restaurant email"
              hint="(optional)"
              type="email"
              id="restaurantEmail"
              name="restaurantEmail"
              value={formData.restaurantEmail}
              onChange={handleChange}
              onBlur={handleBlur}
              error={getFieldError('restaurantEmail')}
              placeholder="contact@restaurant.com"
            />

            <p className="text-sm text-gray-600 font-medium mt-6 mb-4">Restaurant Address</p>

            <Input
              label="Street address"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              onBlur={handleBlur}
              error={getFieldError('address')}
              placeholder="123 Main Street"
              autoComplete="street-address"
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="City"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                onBlur={handleBlur}
                error={getFieldError('city')}
                placeholder="New York"
                autoComplete="address-level2"
              />
              <Input
                label="Country"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                onBlur={handleBlur}
                error={getFieldError('country')}
                placeholder="USA"
                autoComplete="country-name"
              />
            </div>

            <Input
              label="Postal code"
              hint="(optional)"
              id="postalCode"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleChange}
              onBlur={handleBlur}
              error={getFieldError('postalCode')}
              placeholder="10001"
              autoComplete="postal-code"
            />

            <div className="flex gap-3 mt-2">
              <Button type="button" variant="secondary" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button type="submit" isLoading={isLoading} className="flex-1">
                {isLoading ? 'Creating...' : 'Create Restaurant'}
              </Button>
            </div>
          </>
        )}
      </form>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-center text-sm text-gray-500">
          Want to order food instead?{' '}
          <Link href="/auth/register" className="link">
            Register as a customer
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
