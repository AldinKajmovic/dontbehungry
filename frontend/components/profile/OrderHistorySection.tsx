'use client'

import { useLanguage } from '@/hooks/useLanguage'
import { Section } from '@/components/ui'

export function OrderHistorySection() {
  const { t } = useLanguage()

  return (
    <Section
      title={t('profile.orderHistory')}
      description={t('profile.viewTrackOrders')}
    >
      <a
        href="/orders"
        className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-neutral-700 hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors group cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{t('profile.viewAllOrders')}</p>
          </div>
        </div>
        <svg className="w-5 h-5 text-gray-400 dark:text-neutral-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </a>
    </Section>
  )
}
