'use client'

import { createContext, useCallback, useEffect, useState, ReactNode } from 'react'
import { MenuItem, PublicRestaurant } from '@/services/public'
import { logger } from '@/utils/logger'

export interface CartItem {
  id: string
  menuItemId: string
  name: string
  price: number
  quantity: number
  notes?: string
  imageUrl?: string | null
}

export interface CartRestaurant {
  id: string
  name: string
  deliveryFee: number
  minOrderAmount: number
}

export type PaymentMethod = 'CASH' | 'CREDIT_CARD'| 'DIGITAL_WALLET'

interface CartState {
  items: CartItem[]
  restaurant: CartRestaurant | null
  paymentMethod: PaymentMethod
}

interface CartContextType {
  items: CartItem[]
  restaurant: CartRestaurant | null
  paymentMethod: PaymentMethod
  itemCount: number
  subtotal: number
  deliveryFee: number
  tax: number
  minOrderFee: number
  total: number
  isCartOpen: boolean
  addItem: (item: MenuItem, restaurant: PublicRestaurant, quantity?: number, notes?: string) => boolean
  removeItem: (cartItemId: string) => void
  updateQuantity: (cartItemId: string, quantity: number) => void
  updateNotes: (cartItemId: string, notes: string) => void
  setPaymentMethod: (method: PaymentMethod) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  isDifferentRestaurant: (restaurantId: string) => boolean
}

export const CartContext = createContext<CartContextType | undefined>(undefined)

interface CartProviderProps {
  children: ReactNode
}

const CART_STORAGE_KEY = 'dontbehungry_cart'

function loadCartFromStorage(): CartState {
  if (typeof window === 'undefined') {
    return { items: [], restaurant: null, paymentMethod: 'CASH' }
  }

  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        items: parsed.items || [],
        restaurant: parsed.restaurant || null,
        paymentMethod: parsed.paymentMethod || 'CASH',
      }
    }
  } catch {
    logger.warn('Failed to load cart from storage, using defaults')
  }

  return { items: [], restaurant: null, paymentMethod: 'CASH' }
}

function saveCartToStorage(state: CartState): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state))
  } catch {
    logger.warn('Failed to save cart to storage')
  }
}

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([])
  const [restaurant, setRestaurant] = useState<CartRestaurant | null>(null)
  const [paymentMethod, setPaymentMethodState] = useState<PaymentMethod>('CASH')
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)


  useEffect(() => {
    const stored = loadCartFromStorage()
    setItems(stored.items)
    setRestaurant(stored.restaurant)
    setPaymentMethodState(stored.paymentMethod)
    setIsInitialized(true)
  }, [])

  useEffect(() => {
    if (isInitialized) {
      saveCartToStorage({ items, restaurant, paymentMethod })
    }
  }, [items, restaurant, paymentMethod, isInitialized])

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const deliveryFee = restaurant?.deliveryFee ?? 0

  const tax = subtotal * 0.20 // 20% tax

  const minOrderFee = restaurant && subtotal < restaurant.minOrderAmount ? 5 : 0

  const total = subtotal + deliveryFee + tax + minOrderFee

  const isDifferentRestaurant = useCallback(
    (restaurantId: string): boolean => {
      return restaurant !== null && restaurant.id !== restaurantId
    },
    [restaurant]
  )

  const addItem = useCallback(
    (menuItem: MenuItem, rest: PublicRestaurant, quantity = 1, notes?: string): boolean => {

      if (restaurant !== null && restaurant.id !== rest.id) {
        // Return false to indicate different restaurant
        return false
      }

      const price =
        typeof menuItem.price === 'string' ? parseFloat(menuItem.price) : menuItem.price

      setItems((prevItems) => {
        const existingIndex = prevItems.findIndex((item) => item.menuItemId === menuItem.id)

        if (existingIndex >= 0) {
          const updatedItems = [...prevItems]
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
            quantity: updatedItems[existingIndex].quantity + quantity,
          }
          return updatedItems
        }

        const newItem: CartItem = {
          id: `${menuItem.id}-${Date.now()}`,
          menuItemId: menuItem.id,
          name: menuItem.name,
          price,
          quantity,
          notes,
          imageUrl: menuItem.imageUrl,
        }

        return [...prevItems, newItem]
      })

      if (!restaurant) {
        const restDeliveryFee =
          typeof rest.deliveryFee === 'string'
            ? parseFloat(rest.deliveryFee)
            : rest.deliveryFee ?? 0
        const restMinOrder =
          typeof rest.minOrderAmount === 'string'
            ? parseFloat(rest.minOrderAmount)
            : rest.minOrderAmount ?? 0

        setRestaurant({
          id: rest.id,
          name: rest.name,
          deliveryFee: restDeliveryFee,
          minOrderAmount: restMinOrder,
        })
      }

      return true
    },
    [restaurant]
  )

  const removeItem = useCallback((cartItemId: string) => {
    setItems((prevItems) => {
      const newItems = prevItems.filter((item) => item.id !== cartItemId)

      if (newItems.length === 0) {
        setRestaurant(null)
      }

      return newItems
    })
  }, [])

  const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(cartItemId)
      return
    }

    setItems((prevItems) =>
      prevItems.map((item) => (item.id === cartItemId ? { ...item, quantity } : item))
    )
  }, [removeItem])

  const updateNotes = useCallback((cartItemId: string, notes: string) => {
    setItems((prevItems) =>
      prevItems.map((item) => (item.id === cartItemId ? { ...item, notes } : item))
    )
  }, [])

  const setPaymentMethod = useCallback((method: PaymentMethod) => {
    setPaymentMethodState(method)
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    setRestaurant(null)
    setPaymentMethodState('CASH')
  }, [])

  const openCart = useCallback(() => setIsCartOpen(true), [])
  const closeCart = useCallback(() => setIsCartOpen(false), [])
  const toggleCart = useCallback(() => setIsCartOpen((prev) => !prev), [])

  const value: CartContextType = {
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
    addItem,
    removeItem,
    updateQuantity,
    updateNotes,
    setPaymentMethod,
    clearCart,
    openCart,
    closeCart,
    toggleCart,
    isDifferentRestaurant,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
