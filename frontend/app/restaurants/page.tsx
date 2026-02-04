'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import { useLanguage } from '@/hooks/useLanguage'
import { publicService, PublicRestaurant, Category } from '@/services/public'
import { RestaurantCard, CategoryIcon, MealModal } from '@/components/restaurants'
import { GuestBanner, LanguageToggle } from '@/components/ui'
import { CartDrawer } from '@/components/cart'
import { NotificationBell } from '@/components/notifications'
import { logger } from '@/utils/logger'

export default function RestaurantsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { itemCount, openCart } = useCart()
  const { t } = useLanguage()

  const [restaurants, setRestaurants] = useState<PublicRestaurant[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedRestaurant, setSelectedRestaurant] = useState<PublicRestaurant | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const categoryScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadRestaurants()
  }, [selectedCategory, searchQuery, page])

  const loadCategories = async () => {
    try {
      const data = await publicService.getCategories()
      setCategories(data)
    } catch (error) {
      logger.error('Failed to load categories', error)
    }
  }

  const loadRestaurants = async () => {
    setIsLoading(true)
    try {
      const response = await publicService.getRestaurants({
        page,
        limit: 12,
        search: searchQuery || undefined,
        categoryId: selectedCategory || undefined,
        sortBy: 'rating',
        sortOrder: 'desc',
      })
      setRestaurants(response.items)
      setTotalPages(response.pagination.totalPages)
    } catch (error) {
      logger.error('Failed to load restaurants', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCategoryClick = (categoryId: string | null) => {
    setSelectedCategory(categoryId)
    setPage(1)
  }

  const handleRestaurantClick = (restaurant: PublicRestaurant) => {
    setSelectedRestaurant(restaurant)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedRestaurant(null)
  }

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setPage(1)
  }, [])

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = 200
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Guest Banner */}
      <GuestBanner />

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">D</span>
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:block">
                Don&apos;t Be Hungry
              </span>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('restaurants.searchPlaceholder')}
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Language Toggle */}
            <LanguageToggle />

            {/* Auth-dependent UI - show nothing while loading to prevent flash */}
            {authLoading ? (
              <div className="w-24 h-10 bg-gray-100 rounded-lg animate-pulse" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-1">
                <NotificationBell />
                <button
                  onClick={openCart}
                  className="relative p-3 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Open cart"
                >
                  <svg
                    className="w-6 h-6 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {itemCount > 9 ? '9+' : itemCount}
                    </span>
                  )}
                </button>
                <Link
                  href="/my-profile"
                  className="p-3 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="My Profile"
                >
                  <svg
                    className="w-6 h-6 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </Link>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  {t('common.logIn')}
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
                >
                  {t('common.signUp')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="mb-4 text-sm">
          <Link href="/" className="text-primary-600 hover:underline cursor-pointer">{t('common.home')}</Link>
          <span className="text-gray-400 mx-2">&gt;</span>
          <span className="text-gray-600">{t('nav.restaurants')}</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('restaurants.title')}</h1>

        {/* Categories */}
        <div className="relative mb-8">
          {/* Left Arrow */}
          <button
            onClick={() => scrollCategories('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Categories Container */}
          <div
            ref={categoryScrollRef}
            className="flex gap-2 overflow-x-auto scrollbar-hide px-12 py-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* All Categories Option */}
            <button
              onClick={() => handleCategoryClick(null)}
              className={`
                flex flex-col items-center gap-2 min-w-[70px] p-2 rounded-xl
                transition-all duration-300 transform hover:scale-110
                ${!selectedCategory
                  ? 'bg-primary-50 ring-2 ring-primary-500'
                  : 'hover:bg-gray-50'
                }
              `}
            >
              <div
                className={`
                  w-14 h-14 rounded-full flex items-center justify-center
                  transition-all duration-300 transform hover:scale-110
                  ${!selectedCategory
                    ? 'bg-primary-100 shadow-lg'
                    : 'bg-gray-100 hover:bg-gray-200'
                  }
                `}
              >
                <span className="text-2xl">🍽️</span>
              </div>
              <span
                className={`
                  text-xs text-center font-medium
                  ${!selectedCategory ? 'text-primary-700' : 'text-gray-600'}
                `}
              >
                {t('restaurants.allCategories')}
              </span>
            </button>

            {categories.map((category) => (
              <CategoryIcon
                key={category.id}
                category={category}
                isSelected={selectedCategory === category.id}
                onClick={handleCategoryClick}
              />
            ))}
          </div>

          {/* Right Arrow */}
          <button
            onClick={() => scrollCategories('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Section Title */}
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {selectedCategory
            ? categories.find((c) => c.id === selectedCategory)?.name || t('restaurants.title')
            : t('restaurants.allRestaurants')}
        </h2>

        {/* Restaurant Grid */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden bg-white shadow-md animate-pulse">
                <div className="h-40 bg-gray-200" />
                <div className="p-4">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-16">
            <svg
              className="w-20 h-20 mx-auto mb-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('restaurants.noResults')}</h3>
            <p className="text-gray-500">
              {searchQuery
                ? t('restaurants.noResultsSearch', { query: searchQuery })
                : t('restaurants.tryDifferent')}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {restaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onClick={handleRestaurantClick}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8 gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              {t('common.previous')}
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              {t('common.page')} {page} {t('common.of')} {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              {t('common.next')}
            </button>
          </div>
        )}
      </main>

      {/* Meal Modal */}
      <MealModal
        restaurant={selectedRestaurant}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        showAddButton={isAuthenticated}
      />

      {/* Cart Drawer */}
      <CartDrawer />
    </div>
  )
}
