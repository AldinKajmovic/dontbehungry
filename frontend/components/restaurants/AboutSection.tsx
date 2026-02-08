'use client'

import { useState, useEffect, useCallback } from 'react'
import { PublicRestaurant } from '@/services/public'
import { useLanguage } from '@/hooks/useLanguage'

interface AboutSectionProps {
  restaurant: PublicRestaurant
}

const DAY_KEYS = [
  'openingHours.monday',
  'openingHours.tuesday',
  'openingHours.wednesday',
  'openingHours.thursday',
  'openingHours.friday',
  'openingHours.saturday',
  'openingHours.sunday',
]

function isOpenNow(hours: PublicRestaurant['openingHours']): boolean {
  if (!hours?.length) return false
  const now = new Date()
  const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1 // Convert Sunday=0 to our Mon=0 format
  const today = hours.find((h) => h.dayOfWeek === dayOfWeek)
  if (!today || today.isClosed) return false

  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  return currentTime >= today.openTime && currentTime <= today.closeTime
}

function getCurrentDayIndex(): number {
  const day = new Date().getDay()
  return day === 0 ? 6 : day - 1
}

export function AboutSection({ restaurant }: AboutSectionProps) {
  const { t } = useLanguage()
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const images = restaurant.galleryImages ?? []
  const isLightboxOpen = lightboxIndex !== null

  const goToPrev = useCallback(() => {
    setLightboxIndex((i) => (i !== null ? (i - 1 + images.length) % images.length : null))
  }, [images.length])

  const goToNext = useCallback(() => {
    setLightboxIndex((i) => (i !== null ? (i + 1) % images.length : null))
  }, [images.length])

  useEffect(() => {
    if (!isLightboxOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrev()
      else if (e.key === 'ArrowRight') goToNext()
      else if (e.key === 'Escape') setLightboxIndex(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLightboxOpen, goToPrev, goToNext])

  const openNow = isOpenNow(restaurant.openingHours)
  const currentDay = getCurrentDayIndex()

  return (
    <div className="space-y-6">
      {/* Review Stats */}
      {restaurant.reviewStats && (
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(restaurant.reviewStats!.averageRating)
                    ? 'text-yellow-400'
                    : 'text-gray-300'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-sm font-medium text-gray-700">
            {restaurant.reviewStats.averageRating.toFixed(1)}
          </span>
          <span className="text-sm text-gray-500">
            {restaurant.reviewStats.totalReviews > 0
              ? `${t('about.fromReviews').replace('{count}', String(restaurant.reviewStats.totalReviews))}`
              : t('about.noReviewsYet')}
          </span>
        </div>
      )}

      {/* Contact Info */}
      {(restaurant.phone || restaurant.email || restaurant.place) && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('about.contactInfo')}</h3>
          <div className="space-y-2">
            {restaurant.phone && (
              <a
                href={`tel:${restaurant.phone}`}
                className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {restaurant.phone}
              </a>
            )}
            {restaurant.email && (
              <a
                href={`mailto:${restaurant.email}`}
                className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {restaurant.email}
              </a>
            )}
            {restaurant.place && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>
                  {restaurant.place.address}, {restaurant.place.city}
                  {restaurant.place.country ? `, ${restaurant.place.country}` : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gallery */}
      {images.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('about.gallery')}</h3>
          <div className="grid grid-cols-3 gap-2">
            {images.map((img, idx) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setLightboxIndex(idx)}
                className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity"
              >
                <img
                  src={img.imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Opening Hours */}
      {restaurant.openingHours && restaurant.openingHours.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('openingHours.title')}</h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                openNow
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {openNow ? t('openingHours.openNow') : t('openingHours.closedNow')}
            </span>
          </div>
          <div className="space-y-1">
            {restaurant.openingHours.map((h) => (
              <div
                key={h.dayOfWeek}
                className={`flex items-center justify-between py-1.5 px-2 rounded text-sm ${
                  h.dayOfWeek === currentDay ? 'bg-primary-50 font-medium' : ''
                }`}
              >
                <span className="text-gray-700">{t(DAY_KEYS[h.dayOfWeek])}</span>
                <span className={h.isClosed ? 'text-red-500' : 'text-gray-600'}>
                  {h.isClosed ? t('openingHours.closed') : `${h.openTime} - ${h.closeTime}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Carousel */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center z-10"
            onClick={() => setLightboxIndex(null)}
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Previous Button */}
          {images.length > 1 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center z-10"
              onClick={(e) => { e.stopPropagation(); goToPrev() }}
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Image */}
          <img
            src={images[lightboxIndex].imageUrl}
            alt=""
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next Button */}
          {images.length > 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center z-10"
              onClick={(e) => { e.stopPropagation(); goToNext() }}
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 text-white text-sm">
              {lightboxIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
