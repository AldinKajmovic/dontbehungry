# Real-Time Notification System - Backend

## Overview

The notification system provides real-time notifications to users via Socket.IO. Restaurant owners receive notifications when new orders are placed, customers receive order status updates, and drivers receive delivery assignments and ready-for-pickup alerts.

## Notification Types

| Type | Description | Recipient |
|------|-------------|-----------|
| `ORDER_NEW` | New order placed at restaurant | Restaurant Owner |
| `ORDER_STATUS` | Order status changed | Customer |
| `DELIVERY_ASSIGNED` | Driver assigned to order | Driver |
| `DELIVERY_READY` | Order ready for pickup | Driver |

## Architecture

### Database Schema

```prisma
model Notification {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      String   // ORDER_NEW, ORDER_STATUS, DELIVERY_ASSIGNED, DELIVERY_READY
  title     String
  message   String
  data      Json?    // Additional data (orderId, restaurantId, etc.)
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([userId, isRead])
  @@index([userId, createdAt])
}
```

### Socket.IO Server

Located at `backend/src/socket/socket.ts`:

- Authenticates connections using JWT from handshake auth
- Maintains user-to-socket mappings for targeted notifications
- Excludes admin users from connecting

### Files Structure

```
backend/src/
├── socket/
│   ├── index.ts         # Exports socket functions
│   └── socket.ts        # Socket.IO server initialization
├── services/
│   └── notification.service.ts  # Notification CRUD and emit logic
├── controllers/
│   └── notification.controller.ts  # REST endpoint handlers
├── routes/
│   └── notification.routes.ts  # Route definitions
```

## API Endpoints

All endpoints require authentication.

### GET /api/notifications

List notifications for the authenticated user.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "ORDER_NEW",
      "title": "New Order Received",
      "message": "You have a new order at Restaurant Name for $25.00",
      "data": { "orderId": "uuid", "restaurantName": "...", "totalAmount": "25.00" },
      "isRead": false,
      "createdAt": "2026-01-31T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

### GET /api/notifications/unread-count

Get count of unread notifications.

**Response:**
```json
{
  "count": 5
}
```

### PATCH /api/notifications/:id/read

Mark a single notification as read.

**Response:**
```json
{
  "message": "Notification marked as read",
  "notification": { ... }
}
```

### PATCH /api/notifications/read-all

Mark all notifications as read.

**Response:**
```json
{
  "message": "All notifications marked as read",
  "count": 5
}
```

### DELETE /api/notifications/:id

Delete a notification.

**Response:**
```json
{
  "message": "Notification deleted successfully"
}
```

## Driver Order Assignment Events

In addition to persisted notifications, the system uses ephemeral socket events for the driver order queue. These events are not stored in the Notification table — they are real-time only.

| Event | Direction | Payload | Purpose |
|---|---|---|---|
| `order:available` | Server → Eligible drivers | `{ orderId, restaurantName, restaurantAddress, deliveryAddress, totalAmount, itemCount, createdAt, estimatedDistance }` | New order broadcast to nearby online drivers |
| `order:accepted` | Server → All online drivers + customer + restaurant owner | `{ orderId, driverName }` | A driver accepted an order |
| `order:removed` | Server → All online drivers | `{ orderId, reason }` | Order cancelled or admin-assigned a driver |

These events are emitted by `orderBroadcast.service.ts`. See `backend/guides/order-assignment.md` for full details.

## Socket Events

### Client to Server

Clients connect via Socket.IO with JWT authentication:

```javascript
const socket = io('http://localhost:3001', {
  auth: { token: 'jwt-token' },
  withCredentials: true,
})
```

### Server to Client

| Event | Description | Payload |
|-------|-------------|---------|
| `notification` | New notification | Notification object |

## Integration Points

### Order Creation (profile.service.ts)

When an order is created:
1. Fetches restaurant owner ID
2. Calls `notifyNewOrder()` to create and emit notification
3. Calls `broadcastOrderToNearbyDrivers()` (fire-and-forget) to emit `order:available` to eligible drivers

### Order Status Update (profile.service.ts)

When order status changes:
1. Fetches customer ID from order
2. Calls `notifyOrderStatusChange()` to notify customer
3. If status is `READY_FOR_PICKUP` and driver is assigned, calls `notifyDeliveryReady()`

### Admin Panel Order Management (admin/orders.service.ts)

When admin updates an order:

**Driver Assignment:**
1. Compares new driver with existing driver
2. If driver changed, notifies the new driver via `notifyDeliveryAssigned()`
3. Also notifies restaurant owner via `notifyRestaurantDriverAssigned()`

**Status Change:**
1. Compares new status with existing status
2. Notifies customer via `notifyOrderStatusChange()`
3. Notifies restaurant owner via `notifyRestaurantOrderStatusChange()`
4. If status is `READY_FOR_PICKUP` and driver is assigned, notifies driver via `notifyDeliveryReady()`

**Admin Order Creation:**
1. Notifies restaurant owner via `notifyNewOrder()`
2. If driver is assigned, notifies driver via `notifyDeliveryAssigned()`
3. Also notifies restaurant owner about driver assignment via `notifyRestaurantDriverAssigned()`

## Security

- Socket connections require valid JWT
- Notifications are user-scoped (users can only access their own)
- Admin users are excluded from receiving notifications
- Notification creation validates user exists and is not an admin

## Usage Example

### Creating a notification from a service

```typescript
import { notifyNewOrder } from './notification.service'

// In your order creation logic:
notifyNewOrder(
  restaurantOwnerId,
  orderId,
  restaurantName,
  totalAmount
)
```

### Helper functions available

```typescript
// Notify restaurant owner of new order
notifyNewOrder(restaurantOwnerId, orderId, restaurantName, totalAmount)

// Notify customer of order status change
notifyOrderStatusChange(customerId, orderId, status, restaurantName)

// Notify driver of new delivery assignment
notifyDeliveryAssigned(driverId, orderId, restaurantName, deliveryAddress)

// Notify driver that order is ready for pickup
notifyDeliveryReady(driverId, orderId, restaurantName)

// Notify restaurant owner when driver is assigned (admin panel)
notifyRestaurantDriverAssigned(restaurantOwnerId, orderId, restaurantName, driverName)

// Notify restaurant owner of order status change (admin panel)
notifyRestaurantOrderStatusChange(restaurantOwnerId, orderId, status, restaurantName)
```
