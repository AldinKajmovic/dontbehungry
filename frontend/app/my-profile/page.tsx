'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'
import { EmailVerificationBanner, LanguageToggle, ThemeToggle } from '@/components/ui'
import { NotificationBell } from '@/components/notifications'
import {
  ProfilePictureSection,
  ProfileForm,
  PasswordForm,
  AddressSection,
  OrderHistorySection,
  DriverDeliveriesSection,
  DriverAvailabilitySection,
  RestaurantSection,
  AccountInfoSection,
  AdminSection,
  DangerZoneSection,
} from '@/components/profile'

export default function MyProfilePage() {
  const { user, isLoading, logout } = useAuth()
  const { t } = useLanguage()

  const isRestaurantOwner = user?.role === 'RESTAURANT_OWNER'
  const isGoogleUser = !user?.phone && user?.avatarUrl?.includes('google')
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const isDeliveryDriver = user?.role === 'DELIVERY_DRIVER'

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <EmailVerificationBanner />

      {/* Header */}
      <header className="bg-white dark:bg-neutral-900 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/restaurants"
                className="text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('profile.title')}</h1>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <LanguageToggle />
              <NotificationBell />
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-950/50 text-primary-800 dark:text-primary-400">
                {user.role.replace('_', ' ')}
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                {t('profile.logOut')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Profile Picture */}
        <ProfilePictureSection />

        {/* Basic Info Form */}
        <ProfileForm />

        {/* Addresses - Hidden for delivery drivers */}
        {!isDeliveryDriver && <AddressSection />}

        {/* Order History - For customers only */}
        {!isAdmin && !isRestaurantOwner && !isDeliveryDriver && <OrderHistorySection />}

        {/* Driver Availability - For drivers only */}
        {isDeliveryDriver && <DriverAvailabilitySection />}

        {/* Driver Deliveries - For drivers only */}
        {isDeliveryDriver && <DriverDeliveriesSection />}

        {/* Change Password - Hidden for Google-only users */}
        {!isGoogleUser && <PasswordForm />}

        {/* Restaurants - For restaurant owners only */}
        {isRestaurantOwner && <RestaurantSection />}

        {/* Account Info */}
        <AccountInfoSection />

        {/* Admin Section */}
        {isAdmin && <AdminSection />}

        {/* Danger Zone */}
        <DangerZoneSection />
      </main>
    </div>
  )
}
