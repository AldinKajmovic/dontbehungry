'use client'

import { MenuItem } from '@/services/public'
import { useLanguage } from '@/hooks/useLanguage'

interface MenuItemCardProps {
  item: MenuItem
  quantity: number
  isAdded: boolean
  showAddButton: boolean
  onQuantityChange: (id: string, quantity: number) => void
  onAddToCart: (item: MenuItem) => void
  formatPrice: (price: string | number) => string
}

export function MenuItemCard({
  item,
  quantity,
  isAdded,
  showAddButton,
  onQuantityChange,
  onAddToCart,
  formatPrice,
}: MenuItemCardProps) {
  const { t } = useLanguage()

  return (
    <div className="flex gap-3 p-3 rounded-xl bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 group">
      {/* Image */}
      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-neutral-700">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-neutral-500">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{item.name}</h4>
        {item.description && (
          <p className="text-xs text-gray-500 dark:text-neutral-400 line-clamp-2 mb-1">{item.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="font-bold text-primary-600 dark:text-primary-400 text-sm">
            ${formatPrice(item.price)}
          </span>
          {item.preparationTime && (
            <span className="text-xs text-gray-400 dark:text-neutral-500">
              ~{item.preparationTime} {t('mealModal.min')}
            </span>
          )}
        </div>
      </div>

      {/* Add Button - Only show for authenticated users */}
      {showAddButton && (
        <div className="self-center flex flex-col items-center gap-1 flex-shrink-0">
          {/* Quantity Selector */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onQuantityChange(item.id, quantity - 1)}
              className="w-6 h-6 rounded-full bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 dark:hover:bg-neutral-600 flex items-center justify-center text-gray-600 dark:text-neutral-400 text-sm"
              disabled={quantity <= 1}
            >
              -
            </button>
            <span className="w-6 text-center text-sm font-medium">
              {quantity}
            </span>
            <button
              onClick={() => onQuantityChange(item.id, quantity + 1)}
              className="w-6 h-6 rounded-full bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 dark:hover:bg-neutral-600 flex items-center justify-center text-gray-600 dark:text-neutral-400 text-sm"
            >
              +
            </button>
          </div>

          {/* Add Button */}
          <button
            onClick={() => onAddToCart(item)}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all
              ${isAdded
                ? 'bg-green-500 text-white'
                : 'bg-primary-500 hover:bg-primary-600 text-white opacity-0 group-hover:opacity-100'
              }
            `}
          >
            {isAdded ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
