'use client'

import { PublicRestaurant } from '@/services/public'

interface RestaurantCardProps {
  restaurant: PublicRestaurant
  onClick: (restaurant: PublicRestaurant) => void
}

export function RestaurantCard({ restaurant, onClick }: RestaurantCardProps) {
  const rating = typeof restaurant.rating === 'string'
    ? parseFloat(restaurant.rating)
    : restaurant.rating
  const ratingPercent = Math.round(rating * 20)

  const deliveryFee = restaurant.deliveryFee
    ? typeof restaurant.deliveryFee === 'string'
      ? parseFloat(restaurant.deliveryFee)
      : restaurant.deliveryFee
    : 0

  const deliveryTimeMin = 15 + Math.floor(Math.random() * 10)
  const deliveryTimeMax = deliveryTimeMin + 10 + Math.floor(Math.random() * 10)

  return (
    <div
      onClick={() => onClick(restaurant)}
      className="group cursor-pointer rounded-xl overflow-hidden bg-white shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
    >
      {/* Cover Image */}
      <div className="relative h-40 overflow-hidden">
        {restaurant.coverUrl ? (
          <img
            src={restaurant.coverUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
            <svg
              className="w-16 h-16 text-white/50"
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
          </div>
        )}

        {/* Discount Badge */}
        {Math.random() > 0.5 && (
          <div className="absolute top-3 left-3 bg-primary-500 text-white text-xs font-semibold px-2 py-1 rounded">
            -{Math.floor(Math.random() * 20 + 10)}% off some items
          </div>
        )}

        {/* Logo */}
        <div className="absolute bottom-3 left-3 w-14 h-14 rounded-lg bg-white shadow-lg overflow-hidden border-2 border-white transition-transform duration-300 group-hover:scale-110">
          {restaurant.logoUrl ? (
            <img
              src={restaurant.logoUrl}
              alt={`${restaurant.name} logo`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-600 font-bold text-lg">
                {restaurant.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-lg mb-2 truncate">
          {restaurant.name}
        </h3>

        <div className="flex items-center gap-2 flex-wrap text-sm">
          {/* Free Delivery Badge */}
          {deliveryFee === 0 && (
            <span className="inline-flex items-center gap-1 text-secondary-600 font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
              </svg>
              Free delivery
            </span>
          )}

          {/* Distance (shown when logged in) */}
          {restaurant.distance !== undefined && (
            <>
              <span className="inline-flex items-center gap-1 text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {restaurant.distance} km
              </span>
              <span className="text-gray-300">•</span>
            </>
          )}

          {/* Delivery Time */}
          <span className="text-gray-500">
            {deliveryTimeMin}-{deliveryTimeMax} min
          </span>

          <span className="text-gray-300">•</span>

          {/* Rating */}
          <span className="inline-flex items-center gap-1 text-gray-700">
            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {ratingPercent}%
          </span>

          <span className="text-gray-400 text-xs">(500+)</span>
        </div>

        {/* Categories */}
        {restaurant.categories.length > 0 && (
          <div className="mt-2 flex gap-1 flex-wrap">
            {restaurant.categories.slice(0, 3).map((cat) => (
              <span
                key={cat.id}
                className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full"
              >
                {cat.category.name}
              </span>
            ))}
            {restaurant.categories.length > 3 && (
              <span className="text-xs text-gray-400">
                +{restaurant.categories.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
