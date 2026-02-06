# Driver Tracking System - Backend

## Overview

The driver tracking system enables real-time location tracking of delivery drivers for orders with `OUT_FOR_DELIVERY` status. Drivers report their location every 60 seconds when they are online, and customers can view the driver's location on a map.

## Database Schema

### DriverLocation Model

```prisma
model DriverLocation {
  id        String   @id @default(uuid())
  driverId  String   @unique
  latitude  Decimal  @db.Decimal(10, 8)
  longitude Decimal  @db.Decimal(11, 8)
  heading   Int?     // Direction 0-360 degrees
  updatedAt DateTime @default(now()) @updatedAt

  driver User @relation("DriverLocation", fields: [driverId], references: [id], onDelete: Cascade)

  @@index([driverId])
}
```

The model uses:
- `@unique` on `driverId` to ensure one location record per driver (upsert pattern)
- High-precision decimals for latitude/longitude
- Optional `heading` field for direction (useful for map marker rotation)
- `@updatedAt` for automatic timestamp updates

## API Endpoints

### POST /api/profile/location

Driver reports their current location.

**Authorization:** Requires authenticated driver with an active shift.

**Request Body:**
```json
{
  "latitude": 43.8563,
  "longitude": 18.4131,
  "heading": 90
}
```

**Validation:**
- `latitude`: number, required, must be between -90 and 90
- `longitude`: number, required, must be between -180 and 180
- `heading`: number, optional, must be between 0 and 360

**Response:**
```json
{
  "message": "Location updated"
}
```

**Errors:**
- `403 Forbidden` - Not a driver or not online
- `400 Bad Request` - Invalid location data

### GET /api/profile/orders/:orderId/driver-location

Customer retrieves the driver's location for their order.

**Authorization:** Requires authenticated user who owns the order, or admin.

**Response (with location):**
```json
{
  "location": {
    "driverId": "uuid",
    "driverName": "John Doe",
    "latitude": 43.8563,
    "longitude": 18.4131,
    "heading": 90,
    "updatedAt": "2026-02-05T12:00:00.000Z",
    "isStale": false
  }
}
```

**Response (no location available):**
```json
{
  "location": null
}
```

A location is returned only when:
- Order status is `OUT_FOR_DELIVERY`
- A driver is assigned to the order
- The driver has reported their location at least once

The `isStale` flag is `true` when the location is older than 2 minutes.

## Socket Events

### driver:location:update

Emitted to the order's customer when the driver updates their location.

**Event Data:**
```json
{
  "orderId": "uuid",
  "driverId": "uuid",
  "driverName": "John Doe",
  "location": {
    "latitude": 43.8563,
    "longitude": 18.4131,
    "heading": 90
  },
  "timestamp": "2026-02-05T12:00:00.000Z"
}
```

The event is only sent to customers who have orders with status `OUT_FOR_DELIVERY` and the reporting driver assigned.

## Service Functions

### location.service.ts

```typescript
// Update driver location and broadcast to customers
updateDriverLocation(driverId: string, data: UpdateLocationData): Promise<void>

// Get driver location for a specific order (with authorization)
getDriverLocationForOrder(orderId: string, userId: string, isAdmin: boolean): Promise<DriverLocationResponse | null>
```

## Security Considerations

1. **Driver Authorization**: Only drivers with `DELIVERY_DRIVER` role and an active shift can report location
2. **Customer Authorization**: Only the order owner or admins can view driver location
3. **Status Check**: Location is only exposed for `OUT_FOR_DELIVERY` orders
4. **Input Validation**: Coordinates are validated to be within valid ranges
5. **Single Record Pattern**: Uses upsert to maintain one location per driver (no location history stored)

## Update Frequency

- Drivers report location every **60 seconds** (configured on frontend)
- Location is considered **stale** after **2 minutes** without updates
