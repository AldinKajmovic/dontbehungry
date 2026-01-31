'use client'

import { useEffect, useState } from 'react'
import { PublicRestaurant, MenuCategory, publicService } from '@/services/public'

interface MealModalProps {
  restaurant: PublicRestaurant | null
  isOpen: boolean
  onClose: () => void
  showAddButton?: boolean
}

export function MealModal({ restaurant, isOpen, onClose, showAddButton = false }: MealModalProps) {
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && restaurant) {
      loadMenuItems()
    }
  }, [isOpen, restaurant])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  const loadMenuItems = async () => {
    if (!restaurant) return
    setIsLoading(true)
    try {
      const items = await publicService.getRestaurantMenuItems(restaurant.id)
      setMenuCategories(items)
      if (items.length > 0) {
        setSelectedCategory(items[0].categoryId)
      }
    } catch (error) {
      console.error('Failed to load menu items:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (price: string | number): string => {
    const num = typeof price === 'string' ? parseFloat(price) : price
    return num.toFixed(2)
  }

  if (!isOpen || !restaurant) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop - instant appearance */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container - centered */}
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
                <p>No menu items available for this restaurant.</p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {menuCategories
                  .filter((cat) => !selectedCategory || cat.categoryId === selectedCategory)
                  .flatMap((cat) => cat.items)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer group"
                    >
                      {/* Image */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
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
                        <h4 className="font-semibold text-gray-900 text-sm mb-1">{item.name}</h4>
                        {item.description && (
                          <p className="text-xs text-gray-500 line-clamp-2 mb-1">{item.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-primary-600 text-sm">
                            {formatPrice(item.price)} KM
                          </span>
                          {item.preparationTime && (
                            <span className="text-xs text-gray-400">
                              ~{item.preparationTime} min
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Add Button - Only show for authenticated users */}
                      {showAddButton && (
                        <button className="self-center w-8 h-8 rounded-full bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
