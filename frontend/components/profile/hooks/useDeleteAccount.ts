'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { profileService } from '@/services/profile'

export function useDeleteAccount() {
  const { logout } = useAuth()

  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const openModal = useCallback(() => {
    setShowModal(true)
    setStep(1)
    setError('')
  }, [])

  const closeModal = useCallback(() => {
    setShowModal(false)
    setStep(1)
    setError('')
  }, [])

  const nextStep = useCallback(() => {
    setStep(2)
  }, [])

  const handleDelete = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      await profileService.deleteAccount()
      await logout()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account')
      setLoading(false)
    }
  }, [logout])

  return {
    showModal,
    step,
    loading,
    error,
    openModal,
    closeModal,
    nextStep,
    handleDelete,
  }
}
