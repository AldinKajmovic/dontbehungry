'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export default function Home() {
  const { user, isAuthenticated, logout, isLoading } = useAuth()

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-40" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-secondary-100 rounded-full blur-3xl opacity-40" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-gray-900">Glovo Copy</span>
        </div>
        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="w-20 h-10 bg-gray-200 rounded-xl animate-pulse" />
          ) : isAuthenticated ? (
            <>
              <span className="text-gray-700">Hi, {user?.firstName}</span>
              <button
                onClick={logout}
                className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-all hover:scale-105 active:scale-95"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/auth/register"
                className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-all hover:scale-105 active:scale-95"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
            Food delivery made{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-600">
              simple
            </span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 leading-relaxed">
            Order from your favorite local restaurants with fast delivery right to your door.
            Fresh food, delivered fresh.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary-500/30"
            >
              Start ordering now
            </Link>
            <Link
              href="/restaurants"
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-2xl transition-all border border-gray-200 hover:border-gray-300"
            >
              Browse restaurants
            </Link>
          </div>
        </div>

        {/* Feature cards */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg shadow-gray-200/50 hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Fast Delivery</h3>
            <p className="text-gray-600">Get your food delivered in under 30 minutes from restaurants near you.</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg shadow-gray-200/50 hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-secondary-100 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Quality Food</h3>
            <p className="text-gray-600">Partnered with the best local restaurants to ensure fresh, quality meals.</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg shadow-gray-200/50 hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Easy Payment</h3>
            <p className="text-gray-600">Multiple payment options including cards, digital wallets, and cash.</p>
          </div>
        </div>
      </section>
    </main>
  )
}
