'use client'

import { useState, useEffect } from 'react'
import { PublicRestaurant, MenuCategory, MenuItem, publicService } from '@/services/public'
import { useCart } from '@/hooks/useCart'
import { logger } from '@/utils/logger'

interface ItemQuantities {
  [menuItemId: string]: number
}

export function useMealModal(restaurant: PublicRestaurant | null, isOpen: boolean) {
  const { addItem, isDifferentRestaurant, clearCart } = useCart()

  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [itemQuantities, setItemQuantities] = useState<ItemQuantities>({})
  const [showDifferentRestaurantModal, setShowDifferentRestaurantModal] = useState(false)
  const [pendingItem, setPendingItem] = useState<MenuItem | null>(null)
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (isOpen && restaurant) {
      loadMenuItems()
      setItemQuantities({})
      setAddedItems(new Set())
    }
  }, [isOpen, restaurant])

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
      logger.error('Failed to load menu items', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getQuantity = (menuItemId: string): number => {
    return itemQuantities[menuItemId] || 1
  }

  const setQuantity = (menuItemId: string, quantity: number) => {
    if (quantity < 1) return
    setItemQuantities((prev) => ({ ...prev, [menuItemId]: quantity }))
  }

  const showAddedFeedback = (itemId: string) => {
    setAddedItems((prev) => new Set(prev).add(itemId))
    setTimeout(() => {
      setAddedItems((prev) => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }, 1500)
  }

  const resetItemQuantity = (itemId: string) => {
    setItemQuantities((prev) => {
      const newQuantities = { ...prev }
      delete newQuantities[itemId]
      return newQuantities
    })
  }

  const handleAddToCart = (item: MenuItem) => {
    if (!restaurant) return

    // Check if adding from a different restaurant
    if (isDifferentRestaurant(restaurant.id)) {
      setPendingItem(item)
      setShowDifferentRestaurantModal(true)
      return
    }

    const quantity = getQuantity(item.id)
    const success = addItem(item, restaurant, quantity)

    if (success) {
      showAddedFeedback(item.id)
      resetItemQuantity(item.id)
    }
  }

  const handleConfirmNewRestaurant = () => {
    if (!pendingItem || !restaurant) return

    // Clear cart and add new item
    clearCart()
    const quantity = getQuantity(pendingItem.id)
    addItem(pendingItem, restaurant, quantity)

    showAddedFeedback(pendingItem.id)
    resetItemQuantity(pendingItem.id)

    setShowDifferentRestaurantModal(false)
    setPendingItem(null)
  }

  const handleCancelNewRestaurant = () => {
    setShowDifferentRestaurantModal(false)
    setPendingItem(null)
  }

  return {
    menuCategories,
    isLoading,
    selectedCategory,
    setSelectedCategory,
    itemQuantities,
    addedItems,
    showDifferentRestaurantModal,
    getQuantity,
    setQuantity,
    handleAddToCart,
    handleConfirmNewRestaurant,
    handleCancelNewRestaurant,
  }
}
