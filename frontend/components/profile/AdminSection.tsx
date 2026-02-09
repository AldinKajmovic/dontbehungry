'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'
import { Button, Section } from '@/components/ui'

export function AdminSection() {
  const { user } = useAuth()
  const { t } = useLanguage()

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

  if (!isAdmin) return null

  return (
    <Section title={t('profile.administration')}>
      <p className="text-sm text-gray-600 dark:text-neutral-400 mb-4">
        {t('admin.welcomeMessage')}
      </p>
      <Link href="/panel">
        <Button type="button" className="!w-auto !px-6">
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            {t('profile.goToAdminPanel')}
          </span>
        </Button>
      </Link>
    </Section>
  )
}
