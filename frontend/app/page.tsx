'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'
import { EmailVerificationBanner, FeatureCard } from '@/components/ui'
import { Header } from '@/components/layout'

const ClockIcon = (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const CheckIcon = (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const PaymentIcon = (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
)

export default function Home() {
  const { isAuthenticated } = useAuth()
  const { t } = useLanguage()

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50">
      <EmailVerificationBanner />
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-40" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-secondary-100 rounded-full blur-3xl opacity-40" />
      </div>

      {/* Navigation */}
      <Header showBrowseButton={isAuthenticated} />

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
            {t('home.title')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-600">
              {t('home.titleHighlight')}
            </span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 leading-relaxed">
            {t('home.subtitle')}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary-500/30"
            >
              {t('home.startOrdering')}
            </Link>
            <Link
              href="/restaurants"
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-2xl transition-all border border-gray-200 hover:border-gray-300"
            >
              {t('home.browseRestaurants')}
            </Link>
          </div>
        </div>

        {/* Feature cards */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={ClockIcon}
            iconColor="primary"
            title={t('home.features.fastDelivery.title')}
            description={t('home.features.fastDelivery.description')}
          />
          <FeatureCard
            icon={CheckIcon}
            iconColor="secondary"
            title={t('home.features.qualityFood.title')}
            description={t('home.features.qualityFood.description')}
          />
          <FeatureCard
            icon={PaymentIcon}
            iconColor="blue"
            title={t('home.features.easyPayment.title')}
            description={t('home.features.easyPayment.description')}
          />
        </div>
      </section>
    </main>
  )
}
