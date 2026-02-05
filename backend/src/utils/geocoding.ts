import { logger } from './logger'

export interface Coordinates {
  latitude: number
  longitude: number
}

export async function geocodeAddress(
  address: string,
  city: string,
  country: string,
  state?: string | null,
  postalCode?: string | null
): Promise<Coordinates | null> {
  try {
    const parts = [address, city]
    if (state) parts.push(state)
    if (postalCode) parts.push(postalCode)
    parts.push(country)

    const query = encodeURIComponent(parts.join(', '))
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'DontBeHungry/1.0 (food-delivery-app)',
      },
    })

    if (!response.ok) {
      logger.warn('Geocoding API returned error', { status: response.status })
      return null
    }

    const data = await response.json() as Array<{ lat: string; lon: string }>

    if (data && data.length > 0) {
      const result = {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      }
      logger.info('Geocoded address successfully', {
        address: parts.join(', ').substring(0, 50),
        lat: result.latitude,
        lon: result.longitude,
      })
      return result
    }

    logger.warn('No geocoding results found', { query: parts.join(', ').substring(0, 50) })
    return null
  } catch (error) {
    logger.error('Geocoding error', error)
    return null
  }
}
