'use client'

import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'
import { Section } from '@/components/ui'

export function AccountInfoSection() {
  const { user } = useAuth()
  const { t } = useLanguage()

  if (!user) return null

  return (
    <Section title={t('profile.accountInfo')}>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-neutral-800">
          <span className="text-gray-500 dark:text-neutral-400">Role</span>
          <span className="text-gray-900 dark:text-white">{user.role.replace('_', ' ')}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-neutral-800">
          <span className="text-gray-500 dark:text-neutral-400">{t('profile.emailStatus')}</span>
          <span className={user.emailVerified ? 'text-green-600' : 'text-yellow-600'}>
            {user.emailVerified ? t('profile.verified') : t('profile.notVerified')}
          </span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-gray-500 dark:text-neutral-400">{t('profile.phoneStatus')}</span>
          <span className={user.phoneVerified ? 'text-green-600' : 'text-gray-400 dark:text-neutral-500'}>
            {user.phoneVerified ? t('profile.verified') : t('profile.notVerified')}
          </span>
        </div>
      </div>
    </Section>
  )
}
