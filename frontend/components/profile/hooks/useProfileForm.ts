'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { profileService, UpdateProfileData } from '@/services/profile'

interface ProfileFormState {
  firstName: string
  lastName: string
  phone: string
  email: string
}

export function useProfileForm() {
  const { user, updateUser } = useAuth()

  const [form, setForm] = useState<ProfileFormState>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  })
  const [initialized, setInitialized] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Initialize form when user loads
  useEffect(() => {
    if (user && !initialized) {
      setForm({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || '',
        email: user.email,
      })
      setInitialized(true)
    }
  }, [user, initialized])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const data: UpdateProfileData = {}
      if (form.firstName !== user?.firstName) {
        data.firstName = form.firstName
      }
      if (form.lastName !== user?.lastName) {
        data.lastName = form.lastName
      }
      if (form.phone !== (user?.phone || '')) {
        data.phone = form.phone || undefined
      }
      if (form.email !== user?.email) {
        data.email = form.email
      }

      if (Object.keys(data).length === 0) {
        setError('No changes to save')
        return
      }

      const response = await profileService.updateProfile(data)
      updateUser(response.user)

      if (response.emailChanged) {
        setSuccess('Profile updated. Please check your new email for a verification link.')
      } else {
        setSuccess('Profile updated successfully')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }, [form, user, updateUser])

  const clearMessages = useCallback(() => {
    setSuccess('')
    setError('')
  }, [])

  return {
    form,
    loading,
    success,
    error,
    handleChange,
    handleSubmit,
    clearMessages,
  }
}
