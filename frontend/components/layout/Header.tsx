'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'
import { LanguageToggle, ThemeToggle } from '@/components/ui'
import logo from '@/assets/logo.png'

interface HeaderProps {
  showAuthButtons?: boolean
  showBrowseButton?: boolean
  heroMode?: boolean
}

export function Header({ showAuthButtons = true, showBrowseButton = false, heroMode = false }: HeaderProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const { t } = useLanguage()

  // When on the hero image, all text must be white for visibility
  const textColor = heroMode ? 'text-white' : 'text-gray-900 dark:text-white'
  const navLinkColor = heroMode
    ? 'text-gray-200 hover:text-white hover:bg-white/10'
    : 'text-gray-600 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-800'
  const signInColor = heroMode
    ? 'text-gray-200 hover:text-white hover:bg-white/10'
    : 'text-gray-700 hover:text-gray-900 dark:text-neutral-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800'
  const greetingColor = heroMode
    ? 'text-gray-200'
    : 'text-gray-700 dark:text-neutral-300'

  return (
    <nav className="relative z-20 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
      <Link href="/" className="flex items-center gap-3">
        <Image
          src={logo}
          alt="Najedise"
          width={150}
          height={150}
          className="rounded-xl"
        />
      </Link>
      <div className="flex items-center gap-2">
        <Link
          href="/restaurants"
          className={`hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${navLinkColor}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          {t('nav.restaurants')}
        </Link>
        <Link
          href="mailto:contact@najedise.com"
          className={`hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${navLinkColor}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          {t('nav.contact')}
        </Link>
        {!heroMode && <ThemeToggle />}
        <LanguageToggle heroMode={heroMode} />
        {showAuthButtons && (
          isLoading ? (
            <div className="w-20 h-10 bg-gray-200 dark:bg-neutral-700 rounded-xl animate-pulse" />
          ) : isAuthenticated ? (
            <>
              <span className={`hidden sm:inline ${greetingColor}`}>{t('home.hi')}, {user?.firstName}</span>
              {showBrowseButton && (
                <Link
                  href="/restaurants"
                  className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-all hover:scale-105 active:scale-95"
                >
                  {t('home.browseRestaurants')}
                </Link>
              )}
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className={`px-5 py-2.5 font-medium rounded-xl transition-all duration-200 ${signInColor}`}
              >
                {t('common.signIn')}
              </Link>
              <Link
                href="/auth/register"
                className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-primary-500/30 active:scale-95"
              >
                {t('common.signUp')}
              </Link>
            </>
          )
        )}
      </div>
    </nav>
  )
}
