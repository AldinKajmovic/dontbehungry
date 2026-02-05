'use client'

import { useEffect } from 'react'
import { PublicRestaurant } from '@/services/public'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'
import { useMealModal } from './hooks'
import { MenuItemCard } from './MenuItemCard'
import { DifferentRestaurantModal } from './DifferentRestaurantModal'

interface MealModalProps {
  restaurant: PublicRestaurant | null
  isOpen: boolean
  onClose: () => void
  showAddButton?: boolean
}

export function MealModal({ restaurant, isOpen, onClose, showAddButton = false }: MealModalProps) {
  const { isAuthenticated } = useAuth()
  const { openCart } = useCart()
  const { t } = useLanguage()

  const {
    menuCategories,
    isLoading,
    selectedCategory,
    setSelectedCategory,
    addedItems,
    showDifferentRestaurantModal,
    getQuantity,
    setQuantity,
    handleAddToCart,
    handleConfirmNewRestaurant,
    handleCancelNewRestaurant,
  } = useMealModal(restaurant, isOpen)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDifferentRestaurantModal) {
          handleCancelNewRestaurant()
        } else {
          onClose()
        }
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose, showDifferentRestaurantModal, handleCancelNewRestaurant])

  const formatPrice = (price: string | number): string => {
    const num = typeof price === 'string' ? parseFloat(price) : price
    return num.toFixed(2)
  }

  const handleViewCart = () => {
    onClose()
    openCart()
  }

  if (!isOpen || !restaurant) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Modal */}
        <div
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-modal-in"
          role="dialog"
          aria-modal="true"
        >
          {/* Header with Cover Image */}
          <div className="relative h-48 md:h-56">
            {restaurant.coverUrl ? (
              <img
                src={restaurant.coverUrl}
                alt={restaurant.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600" />
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* View Cart Button */}
            {isAuthenticated && (
              <button
                onClick={handleViewCart}
                className="absolute top-4 right-16 px-4 py-2 rounded-full bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {t('mealModal.viewCart')}
              </button>
            )}

            {/* Restaurant Info */}
            <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4">
              {/* Logo */}
              <div className="w-16 h-16 rounded-xl bg-white shadow-xl overflow-hidden border-2 border-white flex-shrink-0">
                {restaurant.logoUrl ? (
                  <img
                    src={restaurant.logoUrl}
                    alt={`${restaurant.name} logo`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 font-bold text-xl">
                      {restaurant.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-white pb-1">
                <h2 className="text-xl font-bold mb-1">{restaurant.name}</h2>
                {restaurant.description && (
                  <p className="text-white/80 text-sm line-clamp-1">{restaurant.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          {menuCategories.length > 0 && (
            <div className="border-b border-gray-200 overflow-x-auto">
              <div className="flex px-4 gap-1 min-w-max">
                {menuCategories.map((cat) => (
                  <button
                    key={cat.categoryId}
                    onClick={() => setSelectedCategory(cat.categoryId)}
                    className={`
                      px-4 py-3 text-sm font-medium whitespace-nowrap
                      border-b-2 -mb-px
                      ${selectedCategory === cat.categoryId
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    {cat.categoryName}
                    <span className="ml-1 text-xs text-gray-400">({cat.items.length})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-4 max-h-[50vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : menuCategories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg
                  className="w-12 h-12 mx-auto mb-3 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                <p>{t('mealModal.noMenuItems')}</p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {menuCategories
                  .filter((cat) => !selectedCategory || cat.categoryId === selectedCategory)
                  .flatMap((cat) => cat.items)
                  .map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      quantity={getQuantity(item.id)}
                      isAdded={addedItems.has(item.id)}
                      showAddButton={showAddButton}
                      onQuantityChange={setQuantity}
                      onAddToCart={handleAddToCart}
                      formatPrice={formatPrice}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Different Restaurant Confirmation Modal */}
      <DifferentRestaurantModal
        isOpen={showDifferentRestaurantModal}
        restaurantName={restaurant.name}
        onConfirm={handleConfirmNewRestaurant}
        onCancel={handleCancelNewRestaurant}
      />
    </div>
  )
}
