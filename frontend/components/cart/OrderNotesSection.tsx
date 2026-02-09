'use client'

import { useLanguage } from '@/hooks/useLanguage'

interface OrderNotesSectionProps {
  notes: string
  onChange: (notes: string) => void
}

export function OrderNotesSection({ notes, onChange }: OrderNotesSectionProps) {
  const { t } = useLanguage()

  return (
    <div className="border-t dark:border-neutral-700 pt-4">
      <h3 className="font-medium text-gray-900 dark:text-white mb-3">{t('cart.orderNotesOptional')}</h3>
      <textarea
        value={notes}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('cart.orderNotesPlaceholder')}
        className="w-full p-3 border border-gray-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
        rows={2}
      />
    </div>
  )
}
