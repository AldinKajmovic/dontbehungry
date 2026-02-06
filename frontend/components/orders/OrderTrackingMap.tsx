'use client'

import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '@/hooks/useLanguage'
import { DriverLocationResponse } from '@/services/profile/types'

interface Coordinates {
  lat: number
  lng: number
}

interface OrderTrackingMapProps {
  driverLocation: DriverLocationResponse
  destination: Coordinates
  height?: string
}

// Sarajevo as default center
const DEFAULT_CENTER: Coordinates = { lat: 43.8563, lng: 18.4131 }

export function OrderTrackingMap({
  driverLocation,
  destination,
  height = '300px',
}: OrderTrackingMapProps) {
  const { t } = useLanguage()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const driverMarkerRef = useRef<L.Marker | null>(null)
  const destinationMarkerRef = useRef<L.Marker | null>(null)
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

    // Calculate center between driver and destination
    const center: Coordinates = {
      lat: (driverLocation.latitude + destination.lat) / 2,
      lng: (driverLocation.longitude + destination.lng) / 2,
    }

    // Create map
    const map = L.map(mapRef.current, {
      center: [center.lat || DEFAULT_CENTER.lat, center.lng || DEFAULT_CENTER.lng],
      zoom: 14,
      scrollWheelZoom: false,
    })

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    // Create blue icon for driver
    const driverIcon = L.divIcon({
      className: 'driver-marker',
      html: `
        <div style="
          width: 36px;
          height: 36px;
          background: #3B82F6;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
          </svg>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    })

    // Create red icon for destination
    const destinationIcon = L.divIcon({
      className: 'destination-marker',
      html: `
        <div style="
          width: 32px;
          height: 32px;
          background: #EF4444;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    })

    // Add driver marker
    const driverMarker = L.marker([driverLocation.latitude, driverLocation.longitude], {
      icon: driverIcon,
    }).addTo(map)

    // Add destination marker
    const destMarker = L.marker([destination.lat, destination.lng], {
      icon: destinationIcon,
    }).addTo(map)

    // Fit bounds to show both markers
    const bounds = L.latLngBounds([
      [driverLocation.latitude, driverLocation.longitude],
      [destination.lat, destination.lng],
    ])
    map.fitBounds(bounds, { padding: [50, 50] })

    mapInstanceRef.current = map
    driverMarkerRef.current = driverMarker
    destinationMarkerRef.current = destMarker

    return () => {
      map.remove()
      mapInstanceRef.current = null
      driverMarkerRef.current = null
      destinationMarkerRef.current = null
    }
  }, [leafletLoaded])

  // Update driver marker position when location changes
  useEffect(() => {
    if (!mapInstanceRef.current || !driverMarkerRef.current || !LRef.current) return

    const L = LRef.current

    // Update driver marker position
    driverMarkerRef.current.setLatLng([driverLocation.latitude, driverLocation.longitude])

    // Re-fit bounds
    const bounds = L.latLngBounds([
      [driverLocation.latitude, driverLocation.longitude],
      [destination.lat, destination.lng],
    ])
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] })
  }, [driverLocation.latitude, driverLocation.longitude, destination.lat, destination.lng])

  // Calculate time ago
  const getTimeAgo = () => {
    const updatedAt = new Date(driverLocation.updatedAt).getTime()
    const now = Date.now()
    const minutes = Math.floor((now - updatedAt) / (1000 * 60))

    if (minutes < 1) {
      return t('orders.tracking.justNow')
    } else if (minutes === 1) {
      return t('orders.tracking.oneMinuteAgo')
    } else {
      return t('orders.tracking.minutesAgo', { count: minutes })
    }
  }

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

      {/* Driver info overlay */}
      <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">{driverLocation.driverName}</p>
              <p className="text-xs text-gray-500">
                {t('orders.tracking.lastUpdated')}: {getTimeAgo()}
              </p>
            </div>
          </div>

          {driverLocation.isStale && (
            <div className="flex items-center gap-1 text-amber-600 text-xs">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{t('orders.tracking.locationStale')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg shadow p-2 text-xs">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 bg-blue-500 rounded-full" />
          <span className="text-gray-600">{t('orders.tracking.driver')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full" />
          <span className="text-gray-600">{t('orders.tracking.destination')}</span>
        </div>
      </div>
    </div>
  )
}
