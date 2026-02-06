# Driver Tracking System - Frontend

## Overview

The driver tracking system allows customers to view the real-time location of their delivery driver on a map. The feature is available for orders with status `OUT_FOR_DELIVERY`.

## Components

### OrderTrackingModal

Main modal component that displays the tracking interface.

**Location:** `frontend/components/orders/OrderTrackingModal.tsx`

**Props:**
```typescript
interface OrderTrackingModalProps {
  orderId: string
  destination: {
    lat: number
    lng: number
    address: string
    city: string
  }
  onClose: () => void
}
```

**Usage:**
```tsx
<OrderTrackingModal
  orderId="order-uuid"
  destination={{
    lat: 43.8563,
    lng: 18.4131,
    address: "123 Main St",
    city: "Sarajevo"
  }}
  onClose={() => setShowModal(false)}
/>
```

### OrderTrackingMap

Map component showing driver and destination markers using Leaflet.

**Location:** `frontend/components/orders/OrderTrackingMap.tsx`

**Props:**
```typescript
interface OrderTrackingMapProps {
  driverLocation: DriverLocationResponse
  destination: { lat: number; lng: number }
  height?: string
}
```

**Features:**
- Blue marker for driver location (with car icon)
- Red marker for delivery destination
- Auto-fits bounds to show both markers
- Driver info overlay with name and last update time
- Stale location warning indicator
- Legend for marker colors

## Hook

### useDriverTracking

Custom hook for managing driver location state.

**Location:** `frontend/components/orders/hooks/useDriverTracking.ts`

**Usage:**
```typescript
const { location, loading, error, isStale, refresh } = useDriverTracking({
  orderId: 'order-uuid',
  enabled: true,
})
```

**Features:**
- Initial REST API fetch for driver location
- Socket subscription to `driver:location:update` events
- Automatic stale detection (> 2 minutes)
- Error handling and refresh capability

## Driver Location Reporting

Drivers automatically report their location when online.

**Location:** `frontend/components/profile/hooks/useDriverAvailability.ts`

**Behavior:**
- When driver goes online, location reporting starts immediately
- Location is reported every **60 seconds** using browser Geolocation API
- Uses high accuracy GPS when available
- Shows warning if location sharing fails

## Integration in Orders Page

The "Track Driver" button appears in the orders list for `OUT_FOR_DELIVERY` orders.

**Location:** `frontend/app/orders/page.tsx`

**Conditions for showing button:**
1. Order status is `OUT_FOR_DELIVERY`
2. Order has delivery place coordinates (latitude and longitude)

## Service Methods

### profileService

```typescript
// Get driver location for an order
getDriverLocation(orderId: string): Promise<GetDriverLocationResponse>

// Driver reports their location (called automatically)
updateMyLocation(data: UpdateLocationData): Promise<{ message: string }>
```

## Types

**Location:** `frontend/services/profile/types.ts`

```typescript
interface DriverLocationResponse {
  driverId: string
  driverName: string
  latitude: number
  longitude: number
  heading: number | null
  updatedAt: string
  isStale: boolean
}

interface UpdateLocationData {
  latitude: number
  longitude: number
  heading?: number
}

interface LocationUpdateEvent {
  orderId: string
  driverId: string
  driverName: string
  location: {
    latitude: number
    longitude: number
    heading: number | null
  }
  timestamp: string
}
```

## Translations

All user-facing text is localized. Keys are under `orders.tracking.*` and `profile.availability.*` in the locale files.

**Key translations:**
- `orders.tracking.trackDriver` - "Track Driver" button label
- `orders.tracking.title` - Modal title
- `orders.tracking.waitingForLocation` - Shown when no location available
- `orders.tracking.locationStale` - Warning for outdated location

## Error States

The modal handles several error states:
1. **Loading** - Shows spinner while fetching initial location
2. **Error** - Shows error message with retry button
3. **No Location** - Shows message that driver hasn't reported yet
4. **Stale Location** - Shows warning when location is over 2 minutes old

## Map Library

Uses **Leaflet** with OpenStreetMap tiles:
- Loaded dynamically on client-side only
- Custom markers using divIcon (no external marker images needed)
- Auto-fits bounds to show both driver and destination
