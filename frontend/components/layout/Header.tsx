'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'
import { LanguageToggle } from '@/components/ui'

interface HeaderProps {
  showAuthButtons?: boolean
  showBrowseButton?: boolean
}

export function Header({ showAuthButtons = true, showBrowseButton = false }: HeaderProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const { t } = useLanguage()

  return (
    <nav className="relative z-20 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <span className="text-xl font-bold text-gray-900">Glovo Copy</span>
      </div>
      <div className="flex items-center gap-2">
        <LanguageToggle />
        {showAuthButtons && (
          isLoading ? (
            <div className="w-20 h-10 bg-gray-200 rounded-xl animate-pulse" />
          ) : isAuthenticated ? (
            <>
              <span className="text-gray-700 hidden sm:inline">{t('home.hi')}, {user?.firstName}</span>
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
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                {t('common.signIn')}
              </Link>
              <Link
                href="/auth/register"
                className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-all hover:scale-105 active:scale-95"
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
