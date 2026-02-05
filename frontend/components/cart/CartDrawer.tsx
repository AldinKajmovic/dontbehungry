'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'
import { useToast } from '@/hooks/useToast'
import { profileService } from '@/services/profile'
import { logger } from '@/utils/logger'
import { useCartAddresses } from './hooks'
import { CartItemCard } from './CartItemCard'
import { AddressSection } from './AddressSection'
import { AddressModal } from './AddressModal'
import { PaymentMethodSection } from './PaymentMethodSection'
import { OrderNotesSection } from './OrderNotesSection'
import { CartSummary } from './CartSummary'

export function CartDrawer() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { t } = useLanguage()
  const { toast } = useToast()
  const {
    items,
    restaurant,
    paymentMethod,
    itemCount,
    subtotal,
    deliveryFee,
    tax,
    minOrderFee,
    total,
    isCartOpen,
    closeCart,
    removeItem,
    updateQuantity,
    setPaymentMethod,
    clearCart,
  } = useCart()

  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [notes, setNotes] = useState('')

  // Address management hook
  const addressState = useCartAddresses(isCartOpen, isAuthenticated, items.length > 0)

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isCartOpen])

  const formatPrice = (price: number): string => {
    return price.toFixed(2)
  }

  const handlePlaceOrder = async () => {
    if (!restaurant || items.length === 0 || !addressState.selectedAddressId) {
      setOrderError(t('cart.selectDeliveryAddress'))
      return
    }

    setIsPlacingOrder(true)
    setOrderError(null)

    try {
      await profileService.createOrder({
        restaurantId: restaurant.id,
        deliveryAddressId: addressState.selectedAddressId,
        paymentMethod,
        notes: notes.trim() || undefined,
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          notes: item.notes,
        })),
      })

      setOrderSuccess(true)
      clearCart()
      toast.success(t('toast.orderPlaced'))

      // Redirect to orders page after a short delay
      setTimeout(() => {
        closeCart()
        router.push('/orders')
      }, 2000)
    } catch (error) {
      logger.error('Failed to place order', error)
      setOrderError(error instanceof Error ? error.message : 'Failed to place order. Please try again.')
    } finally {
      setIsPlacingOrder(false)
    }
  }

  if (!isCartOpen) return null

  const canCheckout = items.length > 0 && addressState.selectedAddressId && !isPlacingOrder

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{t('cart.title')}</h2>
            {restaurant && (
              <p className="text-sm text-gray-500">{restaurant.name}</p>
            )}
          </div>
          <button
            onClick={closeCart}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {orderSuccess ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('cart.orderPlaced')}</h3>
              <p className="text-gray-600">{t('cart.orderPlacedDescription')}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('cart.empty')}</h3>
              <p className="text-gray-600 mb-4">{t('cart.emptyDescription')}</p>
              <button
                onClick={closeCart}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
              >
                {t('cart.browseRestaurants')}
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Cart Items */}
              <div className="space-y-3">
                {items.map((item) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                    formatPrice={formatPrice}
                  />
                ))}
              </div>

              {/* Delivery Address */}
              <AddressSection
                addresses={addressState.addresses}
                selectedAddressId={addressState.selectedAddressId}
                isLoading={addressState.isLoadingAddresses}
                onSelectAddress={addressState.setSelectedAddressId}
                onAddNew={addressState.openAddAddressModal}
              />

              {/* Payment Method */}
              <PaymentMethodSection
                selectedMethod={paymentMethod}
                onSelect={setPaymentMethod}
              />

              {/* Order Notes */}
              <OrderNotesSection
                notes={notes}
                onChange={setNotes}
              />

              {/* Error Message */}
              {orderError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{orderError}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && !orderSuccess && (
          <div className="border-t p-4 space-y-3 bg-gray-50">
            <CartSummary
              itemCount={itemCount}
              subtotal={subtotal}
              tax={tax}
              deliveryFee={deliveryFee}
              minOrderFee={minOrderFee}
              total={total}
              minOrderAmount={restaurant?.minOrderAmount}
              formatPrice={formatPrice}
            />

            {/* Checkout Button */}
            <button
              onClick={handlePlaceOrder}
              disabled={!canCheckout}
              className="w-full py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isPlacingOrder ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('cart.placingOrder')}
                </>
              ) : (
                <>
                  {t('cart.placeOrder')} - ${formatPrice(total)}
                </>
              )}
            </button>

            {/* Clear Cart */}
            <button
              onClick={clearCart}
              className="w-full py-2 text-gray-600 hover:text-red-600 text-sm transition-colors"
            >
              {t('cart.clearCart')}
            </button>
          </div>
        )}
      </div>

      {/* Add Address Modal */}
      <AddressModal
        isOpen={addressState.showAddressModal}
        onClose={addressState.closeAddressModal}
        onSubmit={addressState.handleAddressSubmit}
        form={addressState.addressForm}
        onChange={addressState.handleAddressChange}
        isLoading={addressState.addressLoading}
        error={addressState.addressError}
      />
    </div>
  )
}
