'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useLanguage } from '@/hooks/useLanguage'

// Leaflet CSS import handled in layout
interface Coordinates {
  lat: number
  lng: number
}

interface AddressMapProps {
  address: string
  city: string
  country: string
  initialCoordinates?: Coordinates | null
  onCoordinatesChange?: (coords: Coordinates) => void
  height?: string
}

// Default center (roughly center of Europe for international use)
const DEFAULT_CENTER: Coordinates = { lat: 43.8563, lng: 18.4131 } // Sarajevo as default

export function AddressMap({
  address,
  city,
  country,
  initialCoordinates,
  onCoordinatesChange,
  height = '200px',
}: AddressMapProps) {
  const { t } = useLanguage()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [coordinates, setCoordinates] = useState<Coordinates | null>(initialCoordinates || null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const LRef = useRef<typeof import('leaflet') | null>(null)

  // Load Leaflet dynamically (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const loadLeaflet = async () => {
      const L = await import('leaflet')
      // Fix default marker icon paths
      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => string })._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })
      LRef.current = L
      setLeafletLoaded(true)
    }

    loadLeaflet()
  }, [])

  // Initialize map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current || !LRef.current) return

    const L = LRef.current
    const center = coordinates || DEFAULT_CENTER

    // Create map
    const map = L.map(mapRef.current, {
      center: [center.lat, center.lng],
      zoom: coordinates ? 15 : 10,
      scrollWheelZoom: false,
    })

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    // Add draggable marker
    const marker = L.marker([center.lat, center.lng], {
      draggable: true,
    }).addTo(map)

    // Handle marker drag
    marker.on('dragend', () => {
      const position = marker.getLatLng()
      const newCoords = { lat: position.lat, lng: position.lng }
      setCoordinates(newCoords)
      onCoordinatesChange?.(newCoords)
    })

    mapInstanceRef.current = map
    markerRef.current = marker

    return () => {
      map.remove()
      mapInstanceRef.current = null
      markerRef.current = null
    }
  }, [leafletLoaded, onCoordinatesChange])

  // Geocode address when it changes
  const geocodeAddress = useCallback(async () => {
    if (!address || !city || !country) return

    setIsLoading(true)
    try {
      const query = encodeURIComponent(`${address}, ${city}, ${country}`)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
        {
          headers: {
            'User-Agent': 'DontBeHungry/1.0',
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        if (data && data.length > 0) {
          const newCoords = {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          }
          setCoordinates(newCoords)
          onCoordinatesChange?.(newCoords)

          // Update map and marker
          if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.setView([newCoords.lat, newCoords.lng], 15)
            markerRef.current.setLatLng([newCoords.lat, newCoords.lng])
          }
        }
      }
    } catch (error) {
      console.error('Geocoding failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [address, city, country, onCoordinatesChange])

  // Debounced geocoding when address changes
  useEffect(() => {
    if (!address || !city || !country) return

    const timer = setTimeout(() => {
      geocodeAddress()
    }, 1000) // Wait 1 second after typing stops

    return () => clearTimeout(timer)
  }, [address, city, country, geocodeAddress])

  // Update marker when coordinates change externally
  useEffect(() => {
    if (initialCoordinates && mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([initialCoordinates.lat, initialCoordinates.lng], 15)
      markerRef.current.setLatLng([initialCoordinates.lat, initialCoordinates.lng])
    }
  }, [initialCoordinates])

  return (
    <div className="relative">
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
        integrity="sha512-h9FcoyWjHcOcmEVkxOfTLnmZFWIH0iZhZT1H2TbOq55xssQGEJHEaIm+PgoUaZbRvQTNTluNOEfb1ZRy6D3BOw=="
        crossOrigin="anonymous"
      />

      {/* Map container */}
      <div
        ref={mapRef}
        style={{ height, width: '100%' }}
        className="rounded-lg border border-gray-300 z-0"
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-lg">
          <div className="flex items-center gap-2 text-gray-600">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">{t('address.locating')}</span>
          </div>
        </div>
      )}

      {/* Instructions */}
      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {t('address.dragPinToAdjust')}
      </p>
    </div>
  )
}
