'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLanguage } from '@/hooks/useLanguage'
import { adminService, OnlineDriverLocation, AdminDriverLocationEvent } from '@/services/admin'
import api from '@/services/api'
import { logger } from '@/utils/logger'
import type { Socket } from 'socket.io-client'

// Sarajevo as default center
const DEFAULT_CENTER = { lat: 43.8563, lng: 18.4131 }

export default function AdminDriversPage() {
  const { t } = useLanguage()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const socketRef = useRef<Socket | null>(null)
  const LRef = useRef<typeof import('leaflet') | null>(null)

  const [drivers, setDrivers] = useState<OnlineDriverLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [socketConnected, setSocketConnected] = useState(false)
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null)

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

  // Fetch initial driver data
  const fetchDrivers = useCallback(async () => {
    try {
      setError(null)
      const response = await adminService.getOnlineDrivers()
      setDrivers(response.drivers)
    } catch (err) {
      logger.error('Failed to fetch online drivers', err)
      setError(t('admin.drivers.errorLoading'))
    } finally {
      setLoading(false)
    }
  }, [t])

  // Initial fetch
  useEffect(() => {
    fetchDrivers()
  }, [fetchDrivers])

  // Setup admin socket connection
  useEffect(() => {
    if (typeof window === 'undefined') return

    const initSocket = async () => {
      try {
        const { io } = await import('socket.io-client')
        const tokenResponse = await api.get<{ token: string }>('/api/auth/socket-token')
        const token = tokenResponse.data.token

        const socket = io(process.env.NEXT_PUBLIC_API_URL, {
          auth: { token },
          withCredentials: true,
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        })

        socket.on('connect', () => {
          setSocketConnected(true)
          logger.info('Admin socket connected')
        })

        socket.on('disconnect', () => {
          setSocketConnected(false)
          logger.info('Admin socket disconnected')
        })

        socket.on('admin:driver:location:update', (event: AdminDriverLocationEvent) => {
          setDrivers(prev => {
            const idx = prev.findIndex(d => d.id === event.driverId)
            if (idx === -1) {
              // New driver - refetch to get full data
              fetchDrivers()
              return prev
            }

            const updated = [...prev]
            updated[idx] = {
              ...updated[idx],
              location: {
                latitude: event.location.latitude,
                longitude: event.location.longitude,
                heading: event.location.heading,
                updatedAt: event.timestamp,
              },
            }
            return updated
          })
        })

        socketRef.current = socket
      } catch (err) {
        logger.error('Failed to initialize admin socket', err)
      }
    }

    initSocket()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [fetchDrivers])

  // Initialize map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current || !LRef.current) return

    const L = LRef.current

    const map = L.map(mapRef.current, {
      center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
      zoom: 12,
      scrollWheelZoom: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
      markersRef.current.clear()
    }
  }, [leafletLoaded])

  // Update markers when drivers change
  useEffect(() => {
    if (!mapInstanceRef.current || !LRef.current) return

    const L = LRef.current
    const map = mapInstanceRef.current
    const markers = markersRef.current

    // Remove markers for drivers no longer online
    const currentDriverIds = new Set(drivers.map(d => d.id))
    markers.forEach((marker, driverId) => {
      if (!currentDriverIds.has(driverId)) {
        marker.remove()
        markers.delete(driverId)
      }
    })

    // Create driver icon
    const createDriverIcon = (isSelected: boolean) => L.divIcon({
      className: 'driver-marker',
      html: `
        <div style="
          width: ${isSelected ? '44px' : '36px'};
          height: ${isSelected ? '44px' : '36px'};
          background: ${isSelected ? '#059669' : '#3B82F6'};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        ">
          <svg width="${isSelected ? '24' : '20'}" height="${isSelected ? '24' : '20'}" viewBox="0 0 24 24" fill="white">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
          </svg>
        </div>
      `,
      iconSize: [isSelected ? 44 : 36, isSelected ? 44 : 36],
      iconAnchor: [isSelected ? 22 : 18, isSelected ? 22 : 18],
    })

    // Update or create markers
    const bounds: [number, number][] = []

    drivers.forEach(driver => {
      if (!driver.location) return

      const lat = driver.location.latitude
      const lng = driver.location.longitude
      bounds.push([lat, lng])

      const isSelected = selectedDriverId === driver.id
      const existingMarker = markers.get(driver.id)

      if (existingMarker) {
        existingMarker.setLatLng([lat, lng])
        existingMarker.setIcon(createDriverIcon(isSelected))
      } else {
        const marker = L.marker([lat, lng], {
          icon: createDriverIcon(isSelected),
        }).addTo(map)

        marker.bindPopup(`
          <div style="min-width: 150px;">
            <strong>${driver.firstName} ${driver.lastName}</strong><br/>
            <small style="color: #666;">
              ${t('admin.drivers.activeOrders')}: ${driver.activeOrdersCount}<br/>
              ${driver.phone || t('admin.drivers.noPhone')}
            </small>
          </div>
        `)

        marker.on('click', () => {
          setSelectedDriverId(driver.id)
        })

        markers.set(driver.id, marker)
      }
    })

    // Fit bounds if we have drivers
    if (bounds.length > 0) {
      const latLngBounds = L.latLngBounds(bounds)
      map.fitBounds(latLngBounds, { padding: [50, 50], maxZoom: 15 })
    }
  }, [drivers, selectedDriverId, t])

  // Format time ago
  const getTimeAgo = (dateStr: string) => {
    const updatedAt = new Date(dateStr).getTime()
    const now = Date.now()
    const minutes = Math.floor((now - updatedAt) / (1000 * 60))

    if (minutes < 1) return t('orders.tracking.justNow')
    if (minutes === 1) return t('orders.tracking.oneMinuteAgo')
    return t('orders.tracking.minutesAgo', { count: minutes })
  }

  // Handle driver selection from list
  const handleDriverSelect = (driverId: string) => {
    setSelectedDriverId(driverId)

    const driver = drivers.find(d => d.id === driverId)
    if (driver?.location && mapInstanceRef.current) {
      mapInstanceRef.current.setView(
        [driver.location.latitude, driver.location.longitude],
        16,
        { animate: true }
      )

      const marker = markersRef.current.get(driverId)
      if (marker) {
        marker.openPopup()
      }
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
        integrity="sha512-h9FcoyWjHcOcmEVkxOfTLnmZFWIH0iZhZT1H2TbOq55xssQGEJHEaIm+PgoUaZbRvQTNTluNOEfb1ZRy6D3BOw=="
        crossOrigin="anonymous"
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin.drivers.title')}</h1>
          <p className="text-gray-500 dark:text-neutral-400 mt-1">{t('admin.drivers.subtitle')}</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-sm text-gray-500 dark:text-neutral-400">
              {socketConnected ? t('admin.drivers.liveUpdates') : t('admin.drivers.connecting')}
            </span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchDrivers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 dark:text-neutral-300"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t('common.refresh')}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Map */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden">
          {loading && !leafletLoaded ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-gray-500 dark:text-neutral-400">{t('common.loading')}</p>
              </div>
            </div>
          ) : (
            <div ref={mapRef} className="h-full min-h-[400px] lg:min-h-0" />
          )}
        </div>

        {/* Driver List */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white">{t('admin.drivers.onlineDrivers')}</h2>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                {drivers.length} {t('admin.drivers.online')}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-neutral-700 rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-32 mb-2" />
                        <div className="h-3 bg-gray-200 dark:bg-neutral-700 rounded w-24" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : drivers.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400 dark:text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 dark:text-neutral-400 text-sm">{t('admin.drivers.noDriversOnline')}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-neutral-800">
                {drivers.map(driver => (
                  <button
                    key={driver.id}
                    onClick={() => handleDriverSelect(driver.id)}
                    className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors ${
                      selectedDriverId === driver.id ? 'bg-primary-50 dark:bg-primary-950/30 hover:bg-primary-50 dark:hover:bg-primary-950/30' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        selectedDriverId === driver.id ? 'bg-primary-100' : 'bg-blue-100'
                      }`}>
                        <svg className={`w-5 h-5 ${selectedDriverId === driver.id ? 'text-primary-600' : 'text-blue-600'}`} fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {driver.firstName} {driver.lastName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {driver.location ? (
                            <span className="text-xs text-gray-500 dark:text-neutral-400">
                              {t('orders.tracking.lastUpdated')}: {getTimeAgo(driver.location.updatedAt)}
                            </span>
                          ) : (
                            <span className="text-xs text-amber-600">{t('admin.drivers.noLocation')}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            driver.activeOrdersCount > 0
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {driver.activeOrdersCount} {t('admin.drivers.orders')}
                          </span>
                          {driver.phone && (
                            <span className="text-xs text-gray-400 dark:text-neutral-500">{driver.phone}</span>
                          )}
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 dark:text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-6 text-sm text-gray-500 dark:text-neutral-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full" />
          <span>{t('admin.drivers.driverMarker')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-emerald-500 rounded-full" />
          <span>{t('admin.drivers.selectedDriver')}</span>
        </div>
      </div>
    </div>
  )
}
