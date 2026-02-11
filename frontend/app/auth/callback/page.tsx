'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useAuth } from '@/hooks/useAuth'
import { authService } from '@/services/auth'

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refreshUser } = useAuth()
  const { data: session, status } = useSession()
  const handledRef = useRef(false)

  useEffect(() => {
    if (handledRef.current) return
    if (status === 'loading') return

    const error = searchParams.get('error')
    if (error) {
      handledRef.current = true
      router.push(`/auth/login?error=${encodeURIComponent(error)}`)
      return
    }

    const success = searchParams.get('success')
    if (!success) {
      handledRef.current = true
      router.push('/auth/login')
      return
    }

    // Need NextAuth session with Google ID token to call our backend
    if (!session?.googleIdToken) return

    handledRef.current = true

    const completeAuth = async () => {
      try {
        await authService.googleAuth({
          idToken: session.googleIdToken as string,
        })
        await refreshUser()
        router.push('/restaurants')
      } catch {
        router.push('/auth/login?error=google-auth-failed')
      }
    }

    completeAuth()
  }, [searchParams, router, refreshUser, session, status])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto" />
        <p className="mt-4 text-gray-600 dark:text-neutral-400">Completing sign in...</p>
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
