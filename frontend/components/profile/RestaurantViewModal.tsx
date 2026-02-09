'use client'

import { useState } from 'react'
import { Button, Modal } from '@/components/ui'
import { MyRestaurant } from '@/services/profile'
import { MenuItemsModal } from './MenuItemsModal'
import { RestaurantOrdersModal } from './RestaurantOrdersModal'

interface RestaurantViewModalProps {
  isOpen: boolean
  onClose: () => void
  restaurant: MyRestaurant | null
  onEdit: () => void
}

const RestaurantIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

export function RestaurantViewModal({
  isOpen,
  onClose,
  restaurant,
  onEdit,
}: RestaurantViewModalProps) {
  const [showMenuItems, setShowMenuItems] = useState(false)
  const [showOrders, setShowOrders] = useState(false)

  if (!restaurant) return null

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={restaurant.name}
        icon={RestaurantIcon}
        iconColor="primary"
        size="lg"
      >
        <div className="space-y-6">
          {/* Cover Image */}
          {restaurant.coverUrl && (
            <div className="relative h-48 rounded-lg overflow-hidden bg-gray-100 dark:bg-neutral-800">
              <img
                src={restaurant.coverUrl}
                alt={`${restaurant.name} cover`}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Logo and Basic Info */}
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 bg-primary-100 dark:bg-primary-950/30 rounded-xl flex items-center justify-center flex-shrink-0">
              {restaurant.logoUrl ? (
                <img
                  src={restaurant.logoUrl}
                  alt={restaurant.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <svg className="w-10 h-10 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{restaurant.name}</h3>
              {restaurant.description && (
                <p className="text-sm text-gray-600 dark:text-neutral-400 mt-1">{restaurant.description}</p>
              )}
              {restaurant.rating && parseFloat(restaurant.rating) > 0 && (
                <div className="flex items-center gap-1 mt-2 text-yellow-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm font-medium">{restaurant.rating}</span>
                </div>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-3">
              <div>
                <p className="text-gray-500 dark:text-neutral-400">Location</p>
                <p className="text-gray-900 dark:text-white">
                  {restaurant.place.address}, {restaurant.place.city}, {restaurant.place.country}
                </p>
              </div>
              {restaurant.phone && (
                <div>
                  <p className="text-gray-500 dark:text-neutral-400">Phone</p>
                  <p className="text-gray-900 dark:text-white">{restaurant.phone}</p>
                </div>
              )}
              {restaurant.email && (
                <div>
                  <p className="text-gray-500 dark:text-neutral-400">Email</p>
                  <p className="text-gray-900 dark:text-white">{restaurant.email}</p>
                </div>
              )}
            </div>
            <div className="space-y-3">
              {restaurant.minOrderAmount && (
                <div>
                  <p className="text-gray-500 dark:text-neutral-400">Min Order Amount</p>
                  <p className="text-gray-900 dark:text-white">${restaurant.minOrderAmount}</p>
                </div>
              )}
              {restaurant.deliveryFee && (
                <div>
                  <p className="text-gray-500 dark:text-neutral-400">Delivery Fee</p>
                  <p className="text-gray-900 dark:text-white">${restaurant.deliveryFee}</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-neutral-800">
            <Button
              type="button"
              className="flex-1"
              onClick={() => setShowMenuItems(true)}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Edit Menu Items
              </span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setShowOrders(true)}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                View Orders
              </span>
            </Button>
          </div>
          <div className="flex gap-3 mt-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onEdit}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Restaurant
              </span>
            </Button>
          </div>
        </div>
      </Modal>

      <MenuItemsModal
        isOpen={showMenuItems}
        onClose={() => setShowMenuItems(false)}
        restaurant={restaurant}
      />

      <RestaurantOrdersModal
        isOpen={showOrders}
        onClose={() => setShowOrders(false)}
        restaurant={restaurant}
      />
    </>
  )
}
