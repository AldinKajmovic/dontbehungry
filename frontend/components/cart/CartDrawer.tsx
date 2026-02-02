'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import { PaymentMethod } from '@/providers/CartProvider'
import { useAuth } from '@/hooks/useAuth'
import { addressService, Address, AddAddressData } from '@/services/address'
import { profileService } from '@/services/profile'
import { Modal, Input, Button, Alert } from '@/components/ui'

const PAYMENT_METHODS: { value: PaymentMethod; label: string; description: string }[] = [
  { value: 'CASH', label: 'Cash', description: 'Pay with cash when your order arrives' },
  { value: 'CREDIT_CARD', label: 'Credit Card', description: 'Pay with credit card on delivery' },
  { value: 'DIGITAL_WALLET', label: 'Digital Wallet', description: 'Pay with digital wallet (Apple Pay, Google Pay, etc.)' },
]

const LocationIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

export function CartDrawer() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
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

  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [notes, setNotes] = useState('')

  // Address modal state
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [addressForm, setAddressForm] = useState({
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    notes: '',
  })
  const [addressLoading, setAddressLoading] = useState(false)
  const [addressError, setAddressError] = useState('')

  // Load addresses when drawer opens
  useEffect(() => {
    if (isCartOpen && isAuthenticated && items.length > 0) {
      loadAddresses()
    }
  }, [isCartOpen, isAuthenticated, items.length])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isCartOpen])

  const loadAddresses = async () => {
    setIsLoadingAddresses(true)
    try {
      const { addresses: loadedAddresses } = await addressService.getAddresses()
      setAddresses(loadedAddresses)
      // Select default address if available
      const defaultAddress = loadedAddresses.find((a) => a.isDefault)
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id)
      } else if (loadedAddresses.length > 0) {
        setSelectedAddressId(loadedAddresses[0].id)
      }
    } catch (error) {
      console.error('Failed to load addresses:', error)
    } finally {
      setIsLoadingAddresses(false)
    }
  }

  // Address modal functions
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setAddressForm((prev) => ({ ...prev, [name]: value }))
  }

  const openAddAddressModal = () => {
    setAddressForm({
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      notes: '',
    })
    setAddressError('')
    setShowAddressModal(true)
  }

  const closeAddressModal = () => {
    setShowAddressModal(false)
    setAddressError('')
  }

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddressLoading(true)
    setAddressError('')

    if (!addressForm.address || !addressForm.city || !addressForm.country) {
      setAddressError('Address, city, and country are required')
      setAddressLoading(false)
      return
    }

    try {
      const data: AddAddressData = {
        address: addressForm.address,
        city: addressForm.city,
        country: addressForm.country,
        state: addressForm.state || undefined,
        postalCode: addressForm.postalCode || undefined,
        notes: addressForm.notes || undefined,
      }
      const { address } = await addressService.addAddress(data)
      // Add new address to local state and select it
      setAddresses((prev) => [...prev, address])
      setSelectedAddressId(address.id)
      closeAddressModal()
    } catch (err) {
      setAddressError(err instanceof Error ? err.message : 'Failed to save address')
    } finally {
      setAddressLoading(false)
    }
  }

  const formatPrice = (price: number): string => {
    return price.toFixed(2)
  }

  const handlePlaceOrder = async () => {
    if (!restaurant || items.length === 0 || !selectedAddressId) {
      setOrderError('Please select a delivery address')
      return
    }

    setIsPlacingOrder(true)
    setOrderError(null)

    try {
      await profileService.createOrder({
        restaurantId: restaurant.id,
        deliveryAddressId: selectedAddressId,
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

      // Redirect to orders page after a short delay
      setTimeout(() => {
        closeCart()
        router.push('/orders')
      }, 2000)
    } catch (error) {
      console.error('Failed to place order:', error)
      setOrderError(error instanceof Error ? error.message : 'Failed to place order. Please try again.')
    } finally {
      setIsPlacingOrder(false)
    }
  }

  if (!isCartOpen) return null

  const canCheckout = items.length > 0 && selectedAddressId && !isPlacingOrder

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
            <h2 className="text-lg font-semibold text-gray-900">Your Cart</h2>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Placed!</h3>
              <p className="text-gray-600">Your order has been placed successfully. Redirecting to orders...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-gray-600 mb-4">Add some delicious items from a restaurant!</p>
              <button
                onClick={closeCart}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
              >
                Browse restaurants
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Cart Items */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                    {/* Image */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm">{item.name}</h4>
                      <p className="text-primary-600 font-semibold text-sm">
                        ${formatPrice(item.price * item.quantity)}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="self-start p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              {/* Delivery Address */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">Delivery Address</h3>
                  <button
                    onClick={openAddAddressModal}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add new
                  </button>
                </div>
                {isLoadingAddresses ? (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm mb-2">No saved addresses</p>
                    <button
                      onClick={openAddAddressModal}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      Add an address
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {addresses.map((address) => (
                      <label
                        key={address.id}
                        className={`
                          flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                          ${selectedAddressId === address.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name="address"
                          checked={selectedAddressId === address.id}
                          onChange={() => setSelectedAddressId(address.id)}
                          className="mt-1 text-primary-600 focus:ring-primary-500"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{address.address}</p>
                          <p className="text-sm text-gray-500">{address.city}, {address.country}</p>
                          {address.notes && (
                            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                              {address.notes}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3">Payment Method</h3>
                <p className="text-sm text-gray-500 mb-3">
                  Payment will be collected upon delivery
                </p>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map((method) => (
                    <label
                      key={method.value}
                      className={`
                        flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                        ${paymentMethod === method.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === method.value}
                        onChange={() => setPaymentMethod(method.value)}
                        className="mt-1 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{method.label}</p>
                        <p className="text-xs text-gray-500">{method.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Order Notes */}
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3">Order Notes (Optional)</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions for your order..."
                  className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  rows={2}
                />
              </div>

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
            {/* Summary */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({itemCount} items)</span>
                <span>${formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (20%)</span>
                <span>${formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span>${formatPrice(deliveryFee)}</span>
              </div>
              {minOrderFee > 0 && (
                <div className="flex justify-between text-amber-600">
                  <span>Small Order Fee</span>
                  <span>${formatPrice(minOrderFee)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-gray-900 text-base pt-2 border-t">
                <span>Total</span>
                <span>${formatPrice(total)}</span>
              </div>
            </div>

            {/* Small Order Fee Notice */}
            {minOrderFee > 0 && restaurant && (
              <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-700">
                  A ${formatPrice(minOrderFee)} small order fee applies because your order is below the ${formatPrice(restaurant.minOrderAmount)} minimum.
                </p>
              </div>
            )}

            {/* Checkout Button */}
            <button
              onClick={handlePlaceOrder}
              disabled={!canCheckout}
              className="w-full py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isPlacingOrder ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Placing Order...
                </>
              ) : (
                <>
                  Place Order - ${formatPrice(total)}
                </>
              )}
            </button>

            {/* Clear Cart */}
            <button
              onClick={clearCart}
              className="w-full py-2 text-gray-600 hover:text-red-600 text-sm transition-colors"
            >
              Clear cart
            </button>
          </div>
        )}
      </div>

      {/* Add Address Modal */}
      <Modal
        isOpen={showAddressModal}
        onClose={closeAddressModal}
        title="Add New Address"
        icon={LocationIcon}
        iconColor="primary"
        size="lg"
      >
        <form onSubmit={handleAddressSubmit} className="space-y-4">
          {addressError && (
            <Alert type="error">{addressError}</Alert>
          )}

          <Input
            label="Street Address"
            id="cart-address"
            name="address"
            value={addressForm.address}
            onChange={handleAddressChange}
            placeholder="123 Main Street, Apt 4"
            autoComplete="street-address"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              id="cart-city"
              name="city"
              value={addressForm.city}
              onChange={handleAddressChange}
              placeholder="New York"
              autoComplete="address-level2"
            />
            <Input
              label="State/Province"
              id="cart-state"
              name="state"
              value={addressForm.state}
              onChange={handleAddressChange}
              placeholder="NY"
              hint="(optional)"
              autoComplete="address-level1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Country"
              id="cart-country"
              name="country"
              value={addressForm.country}
              onChange={handleAddressChange}
              placeholder="USA"
              autoComplete="country-name"
            />
            <Input
              label="Postal Code"
              id="cart-postalCode"
              name="postalCode"
              value={addressForm.postalCode}
              onChange={handleAddressChange}
              placeholder="10001"
              hint="(optional)"
              autoComplete="postal-code"
            />
          </div>

          <div>
            <label htmlFor="cart-notes" className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="cart-notes"
              name="notes"
              value={addressForm.notes}
              onChange={handleAddressChange}
              placeholder="e.g., Ring doorbell, leave at door..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={closeAddressModal}
              disabled={addressLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              isLoading={addressLoading}
            >
              {addressLoading ? 'Saving...' : 'Add Address'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
