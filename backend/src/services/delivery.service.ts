// Delivery calculation service

import { prisma } from '../lib/prisma'
import { logger } from '../utils/logger'
import { geocodeAddress } from '../utils/geocoding'

const DISTANCE_FEES = {
  UNDER_1KM: 2,
  FROM_1_TO_3KM: 4,
  FROM_3_TO_7KM: 7,
  OVER_7KM: 10, 
}

const WEATHER_SURCHARGE = 8 // For rain, snow, blizzard
const BAD_WEATHER_CONDITIONS = [
  'Rain', 'Drizzle', 'Thunderstorm', 'Snow', 'Sleet',
  'Blizzard', 'Freezing rain', 'Heavy rain', 'Light rain',
]
// (always added) so user can't complain order is late, precaution measure
const PREPARATION_BUFFER_MINUTES = 10

export interface DeliveryInfo {
  distanceKm: number
  distanceText: string
  durationMinutes: number
  durationText: string
  baseFee: number
  weatherSurcharge: number
  totalFee: number
  weatherCondition: string | null
  isWeatherBad: boolean
  estimatedDeliveryTime: Date
  note: string
}

export interface Coordinates {
  latitude: number
  longitude: number
}

interface WeatherResponse {
  weather?: Array<{
    main: string
  }>
}

function roundDistance(km: number): number {
  return Math.round(km * 10) / 10
}

function formatDistance(km: number): string {
  const rounded = roundDistance(km)
  return `${rounded} km`
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
}

function calculateBaseFee(distanceKm: number): number {
  if (distanceKm < 1) {
    return DISTANCE_FEES.UNDER_1KM
  } else if (distanceKm <= 3) {
    return DISTANCE_FEES.FROM_1_TO_3KM
  } else if (distanceKm <= 7) {
    return DISTANCE_FEES.FROM_3_TO_7KM
  } else {
    return DISTANCE_FEES.OVER_7KM
  }
}

// OpenRouteService response type
interface ORSResponse {
  features?: Array<{
    properties: {
      segments: Array<{
        distance: number
        duration: number
      }>
    }
  }>
}

export async function calculateRoute(
  origin: Coordinates,
  destination: Coordinates
): Promise<{ distanceKm: number; durationMinutes: number } | null> {
  const apiKey = process.env.OPENROUTESERVICE_API_KEY

  if (!apiKey) {
    logger.warn('OpenRouteService API key not configured (OPENROUTESERVICE_API_KEY)')
    return null
  }

  try {
    const response = await fetch(
      'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
      {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coordinates: [
            [origin.longitude, origin.latitude],
            [destination.longitude, destination.latitude],
          ],
        }),
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!response.ok) {
      if (response.status !== 404) {
        const errorText = await response.text()
        logger.warn('OpenRouteService failed', { status: response.status, error: errorText })
      }
      return null
    }

    const data = await response.json() as ORSResponse

    if (data.features && data.features.length > 0) {
      const segment = data.features[0].properties.segments[0]
      return {
        distanceKm: segment.distance / 1000,
        durationMinutes: Math.ceil(segment.duration / 60),
      }
    }

    return null
  } catch (error) {
    logger.error('OpenRouteService error', error)
    return null
  }
}

async function getWeather(coords: Coordinates): Promise<{ condition: string; isBad: boolean } | null> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY

  if (!apiKey) {
    logger.warn('OpenWeatherMap API key not configured')
    return null
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.latitude}&lon=${coords.longitude}&appid=${apiKey}`

    const response = await fetch(url)

    if (!response.ok) {
      logger.warn('Weather API failed', { status: response.status })
      return null
    }

    const data = await response.json() as WeatherResponse

    if (data.weather && data.weather.length > 0) {
      const condition = data.weather[0].main
      const isBad = BAD_WEATHER_CONDITIONS.some(
        (bad) => condition.toLowerCase().includes(bad.toLowerCase())
      )
      return { condition, isBad }
    }

    return null
  } catch (error) {
    logger.error('Weather API error', error)
    return null
  }
}

async function getPlaceCoordinates(placeId: string): Promise<Coordinates | null> {
  const place = await prisma.place.findUnique({
    where: { id: placeId },
  })

  if (!place) return null

  if (place.latitude && place.longitude) {
    return {
      latitude: Number(place.latitude),
      longitude: Number(place.longitude),
    }
  }
  // Turn address into coordinates
  const coords = await geocodeAddress(place.address, place.city, place.country, place.state, place.postalCode)

  if (coords) {
    await prisma.place.update({
      where: { id: placeId },
      data: {
        latitude: coords.latitude,
        longitude: coords.longitude,
      },
    })
  }

  return coords
}

export async function calculateDeliveryInfo(
  restaurantId: string,
  deliveryAddressId: string
): Promise<DeliveryInfo | null> {
  try {

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: { place: true },
    })

    if (!restaurant) {
      logger.warn('Restaurant not found', { restaurantId })
      return null
    }

    const userAddress = await prisma.userAddress.findUnique({
      where: { id: deliveryAddressId },
      include: { place: true },
    })

    if (!userAddress) {
      logger.warn('Delivery address not found', { deliveryAddressId })
      return null
    }

    const restaurantCoords = await getPlaceCoordinates(restaurant.placeId)
    const deliveryCoords = await getPlaceCoordinates(userAddress.placeId)

    if (!restaurantCoords || !deliveryCoords) {
      logger.warn('Could not get coordinates', {
        restaurantCoords: !!restaurantCoords,
        deliveryCoords: !!deliveryCoords,
      })
      return null
    }

    const route = await calculateRoute(restaurantCoords, deliveryCoords)

    if (!route) {
      logger.warn('Could not calculate route')
      return null
    }

    const weather = await getWeather(deliveryCoords)

    // Calculate fees
    const baseFee = calculateBaseFee(route.distanceKm)
    const weatherSurcharge = weather?.isBad ? WEATHER_SURCHARGE : 0
    const totalFee = baseFee + weatherSurcharge
    const totalDuration = route.durationMinutes + PREPARATION_BUFFER_MINUTES
    const estimatedDeliveryTime = new Date()
    estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + totalDuration)

    return {
      distanceKm: roundDistance(route.distanceKm),
      distanceText: formatDistance(route.distanceKm),
      durationMinutes: totalDuration,
      durationText: formatDuration(totalDuration),
      baseFee,
      weatherSurcharge,
      totalFee,
      weatherCondition: weather?.condition || null,
      isWeatherBad: weather?.isBad || false,
      estimatedDeliveryTime,
      note: 'delivery.preparationNote',
    }
  } catch (error) {
    logger.error('Error calculating delivery info', error)
    return null
  }
}


export async function getDeliveryInfoWithFallback(
  restaurantId: string,
  deliveryAddressId: string
): Promise<{
  deliveryInfo: DeliveryInfo | null
  fallbackFee: number
  usedFallback: boolean
}> {

  const deliveryInfo = await calculateDeliveryInfo(restaurantId, deliveryAddressId)

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { deliveryFee: true },
  })

  const fallbackFee = restaurant?.deliveryFee ? Number(restaurant.deliveryFee) : 5

  return {
    deliveryInfo,
    fallbackFee,
    usedFallback: !deliveryInfo,
  }
}
