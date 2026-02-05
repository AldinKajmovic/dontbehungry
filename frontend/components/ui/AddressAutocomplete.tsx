'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useLanguage } from '@/hooks/useLanguage'

interface Coordinates {
  lat: number
  lng: number
}

interface AddressSuggestion {
  displayName: string
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  lat: number
  lng: number
}

interface NominatimResult {
  display_name: string
  lat: string
  lon: string
  address?: {
    road?: string
    house_number?: string
    city?: string
    town?: string
    village?: string
    municipality?: string
    state?: string
    county?: string
    country?: string
    postcode?: string
  }
}

interface AddressAutocompleteProps {
  onAddressSelect: (address: {
    address: string
    city: string
    state: string
    country: string
    postalCode: string
    latitude: number
    longitude: number
  }) => void
  initialAddress?: string
  initialCoordinates?: Coordinates | null
  placeholder?: string
  label?: string
  height?: string
}

// Default center (Sarajevo)
const DEFAULT_CENTER: Coordinates = { lat: 43.8563, lng: 18.4131 }

export function AddressAutocomplete({
  onAddressSelect,
  initialAddress = '',
  initialCoordinates,
  placeholder,
  label,
  height = '180px',
}: AddressAutocompleteProps) {
  const { t } = useLanguage()
  const [query, setQuery] = useState(initialAddress)
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(
    initialCoordinates ? {
      displayName: initialAddress,
      address: initialAddress,
      city: '',
      state: '',
      country: '',
      postalCode: '',
      lat: initialCoordinates.lat,
      lng: initialCoordinates.lng,
    } : null
  )
  const [showMap, setShowMap] = useState(!!initialCoordinates)

  // Leaflet refs
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const LRef = useRef<typeof import('leaflet') | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Load Leaflet dynamically
  useEffect(() => {
    if (typeof window === 'undefined' || !showMap) return

    const loadLeaflet = async () => {
      const L = await import('leaflet')
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
  }, [showMap])

  // Initialize map when address is selected
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || !selectedAddress || !LRef.current) return
    if (mapInstanceRef.current) return // Already initialized

    const L = LRef.current
    const center = { lat: selectedAddress.lat, lng: selectedAddress.lng }

    const map = L.map(mapRef.current, {
      center: [center.lat, center.lng],
      zoom: 16,
      scrollWheelZoom: false,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    const marker = L.marker([center.lat, center.lng], {
      draggable: true,
    }).addTo(map)

    marker.on('dragend', async () => {
      const position = marker.getLatLng()

      // Reverse geocode the new position
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${position.lat}&lon=${position.lng}&format=json&addressdetails=1`,
          { headers: { 'User-Agent': 'DontBeHungry/1.0' } }
        )

        if (response.ok) {
          const data = await response.json()
          const addr = data.address || {}
          const streetAddress = [addr.house_number, addr.road].filter(Boolean).join(' ')
          const city = addr.city || addr.town || addr.village || addr.municipality || ''

          const updated = {
            displayName: data.display_name,
            address: streetAddress || data.display_name.split(',')[0],
            city,
            state: addr.state || addr.county || '',
            country: addr.country || '',
            postalCode: addr.postcode || '',
            lat: position.lat,
            lng: position.lng,
          }

          setSelectedAddress(updated)
          setQuery(data.display_name)

          onAddressSelect({
            address: updated.address,
            city: updated.city,
            state: updated.state,
            country: updated.country,
            postalCode: updated.postalCode,
            latitude: updated.lat,
            longitude: updated.lng,
          })
        }
      } catch (error) {
        console.error('Reverse geocoding failed:', error)
        // Still update coordinates even if reverse geocode fails
        if (selectedAddress) {
          const updated = { ...selectedAddress, lat: position.lat, lng: position.lng }
          setSelectedAddress(updated)
          onAddressSelect({
            address: updated.address,
            city: updated.city,
            state: updated.state,
            country: updated.country,
            postalCode: updated.postalCode,
            latitude: updated.lat,
            longitude: updated.lng,
          })
        }
      }
    })

    mapInstanceRef.current = map
    markerRef.current = marker

    return () => {
      map.remove()
      mapInstanceRef.current = null
      markerRef.current = null
    }
  }, [leafletLoaded, selectedAddress, onAddressSelect])

  // Update map when selected address changes
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && selectedAddress) {
      mapInstanceRef.current.setView([selectedAddress.lat, selectedAddress.lng], 16)
      markerRef.current.setLatLng([selectedAddress.lat, selectedAddress.lng])
    }
  }, [selectedAddress?.lat, selectedAddress?.lng])

  // Search for addresses
  const searchAddresses = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&addressdetails=1&limit=5`,
        {
          headers: { 'User-Agent': 'DontBeHungry/1.0' },
        }
      )

      if (response.ok) {
        const data: NominatimResult[] = await response.json()
        const results: AddressSuggestion[] = data.map((item) => {
          const addr = item.address || {}
          const streetAddress = [addr.house_number, addr.road].filter(Boolean).join(' ')
          const city = addr.city || addr.town || addr.village || addr.municipality || ''

          return {
            displayName: item.display_name,
            address: streetAddress || item.display_name.split(',')[0],
            city,
            state: addr.state || addr.county || '',
            country: addr.country || '',
            postalCode: addr.postcode || '',
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          }
        })
        setSuggestions(results)
      }
    } catch (error) {
      console.error('Address search failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounced search
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setShowSuggestions(true)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      searchAddresses(value)
    }, 300)
  }, [searchAddresses])

  // Handle suggestion selection
  const handleSelect = useCallback((suggestion: AddressSuggestion) => {
    setQuery(suggestion.displayName)
    setSelectedAddress(suggestion)
    setShowSuggestions(false)
    setSuggestions([])
    setShowMap(true)

    onAddressSelect({
      address: suggestion.address,
      city: suggestion.city,
      state: suggestion.state,
      country: suggestion.country,
      postalCode: suggestion.postalCode,
      latitude: suggestion.lat,
      longitude: suggestion.lng,
    })
  }, [onAddressSelect])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="space-y-3">
      {/* Leaflet CSS */}
      {showMap && (
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
          integrity="sha512-h9FcoyWjHcOcmEVkxOfTLnmZFWIH0iZhZT1H2TbOq55xssQGEJHEaIm+PgoUaZbRvQTNTluNOEfb1ZRy6D3BOw=="
          crossOrigin="anonymous"
        />
      )}

      {/* Search Input */}
      <div className="relative">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder={placeholder || t('address.searchPlaceholder') || 'Search for an address...'}
            className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelect(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50"
              >
                <div className="flex items-start gap-3">
                  <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {suggestion.address || suggestion.displayName.split(',')[0]}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {[suggestion.city, suggestion.state, suggestion.country].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Address Display */}
      {selectedAddress && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800 text-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">{t('address.selected') || 'Selected'}:</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            {selectedAddress.address}, {selectedAddress.city}, {selectedAddress.country}
          </p>
        </div>
      )}

      {/* Map */}
      {showMap && selectedAddress && (
        <div className="relative">
          <div
            ref={mapRef}
            style={{ height, width: '100%' }}
            className="rounded-lg border border-gray-300 z-0"
          />
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('address.dragPinToAdjust')}
          </p>
        </div>
      )}
    </div>
  )
}
