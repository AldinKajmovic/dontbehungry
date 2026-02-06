# Driver Order Assignment System

## Overview

When a customer places an order, it is automatically broadcast to all online delivery drivers within 10km of the restaurant. Drivers see available orders in their queue and can accept or deny them. The first driver to accept wins (atomic DB update prevents race conditions).

## How It Works

1. **Customer places order** → `order.service.ts` creates order and calls `broadcastOrderToNearbyDrivers(orderId)` (fire-and-forget)
2. **System finds nearby drivers** → Queries all drivers with an ACTIVE shift and a `DriverLocation` record within 10km (Haversine distance)
3. **Socket broadcast** → Emits `order:available` to each eligible driver
4. **Driver accepts** → Guard checks the driver has no active order (non-DELIVERED/non-CANCELLED), then atomic `updateMany` with `WHERE driverId IS NULL AND status = 'PENDING'` ensures only one driver wins
5. **Other drivers notified** → `order:accepted` event removes the order from all other queues

## Database

### OrderDenial Model

Tracks which drivers have denied which orders so they don't see them again:

```prisma
model OrderDenial {
  id       String @id @default(uuid())
  orderId  String
  driverId String

  order  Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
  driver User  @relation("DriverDenials", fields: [driverId], references: [id], onDelete: Cascade)

  @@unique([orderId, driverId])
  @@index([orderId])
  @@index([driverId])
}
```

## API Endpoints

All endpoints require authentication and `DELIVERY_DRIVER` role.

### GET `/api/profile/available-orders`

Returns PENDING orders within 10km that the driver hasn't denied.

**Response:**
```json
{
  "orders": [
    {
      "orderId": "uuid",
      "restaurantName": "Pizza Palace",
      "restaurantAddress": "123 Main St, Sarajevo",
      "deliveryAddress": "456 Oak Ave, Sarajevo",
      "totalAmount": "25.50",
      "itemCount": 3,
      "createdAt": "2026-02-06T10:00:00.000Z",
      "estimatedDistance": 2.4
    }
  ]
}
```

### POST `/api/profile/orders/:orderId/accept`

Atomically assigns the order to the driver. Returns 409 if already taken.

**Success Response (200):**
```json
{ "success": true, "message": "Order accepted successfully" }
```

**Conflict Response — order already taken (409):**
```json
{ "success": false, "message": "Order is no longer available" }
```

**Conflict Response — driver already has an active order (409):**
```json
{ "success": false, "message": "You already have an active order" }
```

### POST `/api/profile/orders/:orderId/deny`

Records a denial (idempotent). The order remains available for other drivers.

**Response:**
```json
{ "message": "Order denied" }
```

## Socket Events

| Event | Direction | Payload | When |
|---|---|---|---|
| `order:available` | Server → Driver | `AvailableOrderEvent` | New order created near driver |
| `order:accepted` | Server → All drivers | `{ orderId, driverName }` | A driver accepted an order |
| `order:removed` | Server → All drivers | `{ orderId, reason }` | Order cancelled or admin-assigned |

## Race Condition Handling

### Serializable Transaction

The active-order guard and order assignment are wrapped in a Prisma interactive transaction with `Serializable` isolation level. This eliminates the TOCTOU race condition — if two concurrent requests both pass the guard check, the database will abort one of them.

```typescript
const txResult = await prisma.$transaction(async (tx) => {
  // 1. Guard: reject if driver already has an active order
  const activeOrder = await tx.order.findFirst({
    where: { driverId, status: { notIn: ['DELIVERED', 'CANCELLED'] } },
    select: { id: true },
  })
  if (activeOrder) {
    return { success: false, message: 'You already have an active order' }
  }

  // 2. Atomic assignment: only succeeds if order is still PENDING with no driver
  const result = await tx.order.updateMany({
    where: { id: orderId, driverId: null, status: 'PENDING' },
    data: { driverId },
  })
  if (result.count === 0) {
    return { success: false, message: 'Order is no longer available' }
  }

  return { success: true }
}, { isolationLevel: 'Serializable' })
```

This guarantees:
- A driver can only have **one** active order at a time
- Two drivers accepting the same order — only one wins (atomic `updateMany`)
- Two concurrent accepts for different orders by the same driver — serializable isolation prevents both from succeeding

## Integration Points

| File | Integration |
|---|---|
| `services/profile/order.service.ts` | Calls `broadcastOrderToNearbyDrivers` after order creation |
| `services/profile/orderHistory.service.ts` | Calls `removeOrderFromDriverQueues` when order is cancelled |
| `services/admin/orders.service.ts` | Calls `removeOrderFromDriverQueues` when admin assigns a driver |

## Geo Utility

`utils/geo.ts` provides `haversineDistance(lat1, lng1, lat2, lng2)` returning km between two points. The broadcast radius is 10km (straight-line). Drivers without a `DriverLocation` record are excluded.

## Edge Cases

| Scenario | Handling |
|---|---|
| Two drivers accept simultaneously | Atomic DB update — first wins, loser gets `success: false` |
| Driver already has an active order | Guard rejects with "You already have an active order" |
| Stale orders from previous shift | Unassigned when driver starts a new shift (see driver-availability guide) |
| Driver goes offline | Queue clears locally, orders stay PENDING for others |
| Order cancelled while in queue | `order:removed` event clears from all queues |
| Admin assigns driver | `removeOrderFromDriverQueues` clears from all queues |
| Restaurant has no coordinates | Broadcast is skipped, warning logged |
| Driver has no location record | Excluded from broadcast |
| Driver reconnects | `GET /available-orders` re-populates queue |
