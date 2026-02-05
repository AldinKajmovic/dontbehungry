'use client'

import { useLanguage } from '@/hooks/useLanguage'

interface DifferentRestaurantModalProps {
  isOpen: boolean
  restaurantName: string
  onConfirm: () => void
  onCancel: () => void
}

export function DifferentRestaurantModal({
  isOpen,
  restaurantName,
  onConfirm,
  onCancel,
}: DifferentRestaurantModalProps) {
  const { t } = useLanguage()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t('mealModal.startNewOrder')}
        </h3>
        <p className="text-gray-600 mb-4">
          {t('mealModal.differentRestaurantWarning')} <strong>{restaurantName}</strong>?
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {t('mealModal.keepCurrentCart')}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            {t('mealModal.startNewOrderButton')}
          </button>
        </div>
      </div>
    </div>
  )
}
