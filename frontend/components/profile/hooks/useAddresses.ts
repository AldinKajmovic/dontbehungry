'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { addressService, Address } from '@/services/address'

interface AddressFormState {
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  notes: string
}

const INITIAL_FORM: AddressFormState = {
  address: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
  notes: '',
}

export function useAddresses() {
  const { user } = useAuth()

  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [form, setForm] = useState<AddressFormState>(INITIAL_FORM)
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState('')

  // Load addresses
  const loadAddresses = useCallback(async () => {
    try {
      setLoading(true)
      const { addresses } = await addressService.getAddresses()
      setAddresses(addresses)
    } catch {
      // Ignore errors loading addresses
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      loadAddresses()
    }
  }, [user, loadAddresses])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }, [])

  const openAddModal = useCallback(() => {
    setEditingAddress(null)
    setForm(INITIAL_FORM)
    setError('')
    setShowModal(true)
  }, [])

  const openEditModal = useCallback((address: Address) => {
    setEditingAddress(address)
    setForm({
      address: address.address,
      city: address.city,
      state: address.state || '',
      country: address.country,
      postalCode: address.postalCode || '',
      notes: address.notes || '',
    })
    setError('')
    setShowModal(true)
  }, [])

  const closeModal = useCallback(() => {
    setShowModal(false)
    setEditingAddress(null)
    setError('')
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setError('')

    if (!form.address || !form.city || !form.country) {
      setError('Address, city, and country are required')
      setFormLoading(false)
      return
    }

    try {
      if (editingAddress) {
        const { address } = await addressService.updateAddress(editingAddress.id, form)
        setAddresses((prev) => prev.map((a) => (a.id === address.id ? address : a)))
      } else {
        const { address } = await addressService.addAddress(form)
        setAddresses((prev) => [...prev, address])
      }
      closeModal()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save address')
    } finally {
      setFormLoading(false)
    }
  }, [form, editingAddress, closeModal])

  const handleDelete = useCallback(async (id: string) => {
    try {
      await addressService.deleteAddress(id)
      setAddresses((prev) => prev.filter((a) => a.id !== id))
    } catch {
      // Ignore errors
    }
  }, [])

  const handleSetDefault = useCallback(async (id: string) => {
    try {
      await addressService.setDefaultAddress(id)
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, isDefault: a.id === id }))
      )
    } catch {
      // Ignore errors
    }
  }, [])

  return {
    addresses,
    loading,
    showModal,
    editingAddress,
    form,
    formLoading,
    error,
    handleChange,
    openAddModal,
    openEditModal,
    closeModal,
    handleSubmit,
    handleDelete,
    handleSetDefault,
  }
}
