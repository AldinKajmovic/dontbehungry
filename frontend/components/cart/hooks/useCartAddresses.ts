'use client'

import { useState, useEffect, useCallback } from 'react'
import { addressService, Address, AddAddressData } from '@/services/address'
import { logger } from '@/utils/logger'

interface AddressForm {
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  notes: string
  latitude?: number
  longitude?: number
}

const initialAddressForm: AddressForm = {
  address: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
  notes: '',
  latitude: undefined,
  longitude: undefined,
}

export function useCartAddresses(isCartOpen: boolean, isAuthenticated: boolean, hasItems: boolean) {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false)

  // Address modal state
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [addressForm, setAddressForm] = useState<AddressForm>(initialAddressForm)
  const [addressLoading, setAddressLoading] = useState(false)
  const [addressError, setAddressError] = useState('')

  // Load addresses when drawer opens
  useEffect(() => {
    if (isCartOpen && isAuthenticated && hasItems) {
      loadAddresses()
    }
  }, [isCartOpen, isAuthenticated, hasItems])

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
      logger.error('Failed to load addresses', error)
    } finally {
      setIsLoadingAddresses(false)
    }
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setAddressForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddressSelect = useCallback((addr: {
    address: string
    city: string
    state: string
    country: string
    postalCode: string
    latitude: number
    longitude: number
  }) => {
    setAddressForm((prev) => ({
      ...prev,
      address: addr.address,
      city: addr.city,
      state: addr.state,
      country: addr.country,
      postalCode: addr.postalCode,
      latitude: addr.latitude,
      longitude: addr.longitude,
    }))
  }, [])

  const openAddAddressModal = () => {
    setAddressForm(initialAddressForm)
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
        latitude: addressForm.latitude,
        longitude: addressForm.longitude,
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

  return {
    addresses,
    selectedAddressId,
    setSelectedAddressId,
    isLoadingAddresses,
    showAddressModal,
    addressForm,
    addressLoading,
    addressError,
    handleAddressChange,
    handleAddressSelect,
    openAddAddressModal,
    closeAddressModal,
    handleAddressSubmit,
  }
}
