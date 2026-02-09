'use client'

import { useLanguage } from '@/hooks/useLanguage'
import { Section } from '@/components/ui'
import { DeleteAccountModal } from './DeleteAccountModal'

export function DangerZoneSection() {
  const { t } = useLanguage()

  return (
    <Section title={t('profile.dangerZone')} variant="danger">
      <p className="text-sm text-gray-600 dark:text-neutral-400 mb-4">
        {t('profile.dangerZoneDesc')}
      </p>
      <DeleteAccountModal />
    </Section>
  )
}
