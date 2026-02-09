'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'
import { EmailVerificationBanner } from '@/components/ui'
import { Header } from '@/components/layout'
import heroImg from '@/assets/hero.webp'

export default function Home() {
  const { isAuthenticated } = useAuth()
  const { t } = useLanguage()

  return (
    <main className="min-h-screen">
      <EmailVerificationBanner />

      {/* Hero Section with background image */}
      <section className="relative overflow-hidden min-h-screen">
        {/* Background image */}
        <Image
          src={heroImg}
          alt=""
          fill
          priority
          sizes="100vw"
          quality={90}
          className="object-cover"
        />
        {/* Dark gradient overlay - darker on left for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />

        {/* Navigation */}
        <Header showBrowseButton={isAuthenticated} heroMode />

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-40">
          <div className="text-left max-w-2xl">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-50 leading-tight">
              {t('home.title')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-400">
                {t('home.titleHighlight')}
              </span>
            </h1>
            <p className="mt-8 text-xl text-gray-200 leading-relaxed">
              {t('home.subtitle')}
            </p>
            <div className="mt-12 flex flex-col sm:flex-row items-start gap-4">
              <Link
                href="/auth/register"
                className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white text-lg font-bold rounded-2xl transition-all hover:scale-110 active:scale-95 shadow-2xl shadow-primary-500/40 hover:shadow-primary-500/50 ring-1 ring-primary-400/30"
              >
                {t('home.startOrdering')}
              </Link>
              <Link
                href="/restaurants"
                className="w-full sm:w-auto px-10 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-2xl transition-all hover:bg-white/20 hover:scale-105 active:scale-95"
              >
                {t('home.browseRestaurants')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
