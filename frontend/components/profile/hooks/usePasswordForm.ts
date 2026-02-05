'use client'

import { useState, useCallback } from 'react'
import { profileService, ChangePasswordData } from '@/services/profile'

interface PasswordFormState {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export function usePasswordForm() {
  const [form, setForm] = useState<PasswordFormState>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match')
      setLoading(false)
      return
    }

    if (form.newPassword.length < 8) {
      setError('New password must be at least 8 characters')
      setLoading(false)
      return
    }

    try {
      const data: ChangePasswordData = {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      }

      await profileService.changePassword(data)
      setSuccess('Password changed successfully')
      setForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }, [form])

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
