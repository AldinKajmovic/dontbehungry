'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useAuth } from '@/hooks/useAuth'

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refreshUser } = useAuth()

  useEffect(() => {
    const handleCallback = async () => {
      const success = searchParams.get('success')
      const error = searchParams.get('error')

      if (error) {
        router.push(`/auth/login?error=${error}`)
        return
      }

      if (success) {
        // Refresh user data after OAuth login
        await refreshUser()
        router.push('/')
      } else {
        router.push('/auth/login')
      }
    }

    handleCallback()
  }, [searchParams, router, refreshUser])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto" />
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CallbackContent />
    </Suspense>
  )
}
