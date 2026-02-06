# Real-Time Notification System - Frontend

## Overview

The frontend notification system provides real-time notification updates using Socket.IO and a dropdown UI for viewing and managing notifications.

**Note:** The driver order queue (`order:available`, `order:accepted`, `order:removed` events) uses the same Socket.IO connection but is handled by a separate system — see `frontend/guides/order-assignment.md`.

## Architecture

### Providers

The notification system uses two providers:

1. **SocketProvider** (`providers/SocketProvider.tsx`)
   - Manages Socket.IO connection
   - Authenticates using JWT from `/api/auth/socket-token`
   - Provides socket instance and connection status

2. **NotificationProvider** (`providers/NotificationProvider.tsx`)
   - Manages notification state
   - Listens to socket events
   - Provides notification CRUD operations

### Files Structure

```
frontend/
├── providers/
│   ├── SocketProvider.tsx      # Socket.IO connection management
│   └── NotificationProvider.tsx # Notification state management
├── hooks/
│   └── useNotifications.ts     # Hook to access notification context
├── services/
│   └── notification/
│       ├── index.ts            # Exports
│       ├── types.ts            # TypeScript types
│       └── service.ts          # API client
├── components/
│   └── notifications/
│       ├── index.ts            # Exports
│       ├── NotificationBell.tsx    # Bell icon with badge
│       ├── NotificationDropdown.tsx # Dropdown list
│       └── NotificationItem.tsx    # Individual notification
```

## Components

### NotificationBell

Bell icon component with unread count badge. Toggles the notification dropdown.

```tsx
import { NotificationBell } from '@/components/notifications'

// In your header:
<NotificationBell />
```

### NotificationDropdown

Dropdown displaying list of notifications with:
- Header with unread count and "Mark all as read" button
- Scrollable list of notifications
- Load more button for pagination
- Empty state when no notifications

### NotificationItem

Individual notification display with:
- Type-specific icon
- Title and message
- Relative time (e.g., "5 min ago")
- Mark as read button (for unread)
- Delete button
- Visual distinction for read/unread state

## Hooks

### useNotifications

Access notification context anywhere in the app:

```tsx
import { useNotifications } from '@/hooks/useNotifications'

function MyComponent() {
  const {
    notifications,      // Array of notifications
    unreadCount,        // Number of unread
    isLoading,          // Loading state
    hasMore,            // More pages available
    markAsRead,         // Mark single as read
    markAllAsRead,      // Mark all as read
    deleteNotification, // Delete single
    loadMore,           // Load next page
    refresh,            // Refresh all
  } = useNotifications()
}
```

### useSocket

Access socket connection status:

```tsx
import { useSocket } from '@/providers/SocketProvider'

function MyComponent() {
  const { socket, isConnected } = useSocket()
}
```

## Service

### API Methods

```typescript
import { notificationService } from '@/services/notification'

// Get paginated notifications
const response = await notificationService.getNotifications(page, limit)

// Get unread count
const { count } = await notificationService.getUnreadCount()

// Mark as read
await notificationService.markAsRead(notificationId)

// Mark all as read
await notificationService.markAllAsRead()

// Delete notification
await notificationService.deleteNotification(notificationId)
```

## Types

```typescript
type NotificationType =
  | 'ORDER_NEW'
  | 'ORDER_STATUS'
  | 'DELIVERY_ASSIGNED'
  | 'DELIVERY_READY'

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  data: Record<string, unknown> | null
  isRead: boolean
  createdAt: string
}
```

## Provider Setup

Providers are configured in `app/layout.tsx`:

```tsx
<NextAuthProvider>
  <AuthProvider>
    <SocketProvider>
      <NotificationProvider>
        <CartProvider>{children}</CartProvider>
      </NotificationProvider>
    </SocketProvider>
  </AuthProvider>
</NextAuthProvider>
```

## Adding NotificationBell to Pages

Add the NotificationBell component to authenticated headers:

```tsx
import { NotificationBell } from '@/components/notifications'

// In your header for authenticated users:
{isAuthenticated && (
  <div className="flex items-center gap-2">
    <NotificationBell />
    {/* Other buttons */}
  </div>
)}
```

## Real-Time Updates

The NotificationProvider automatically:
1. Listens to the `notification` socket event
2. Adds new notifications to the top of the list
3. Increments the unread count
4. Disconnects when user logs out

## Admin Panel Integration

The admin panel triggers notifications when managing orders:

### Notification Triggers

1. **Driver Assignment**: When admin assigns a driver to an order:
   - Driver receives `DELIVERY_ASSIGNED` notification
   - Restaurant owner receives `ORDER_STATUS` notification about driver assignment

2. **Status Change**: When admin changes order status:
   - Customer receives `ORDER_STATUS` notification
   - Restaurant owner receives `ORDER_STATUS` notification
   - If status is `READY_FOR_PICKUP` and driver is assigned, driver receives `DELIVERY_READY` notification

3. **Order Creation**: When admin creates an order:
   - Restaurant owner receives `ORDER_NEW` notification
   - If driver is assigned, driver receives `DELIVERY_ASSIGNED` notification

### StatusSelect Component

The admin panel uses a specialized `StatusSelect` component for order status selection with colored badges:

```tsx
import { StatusSelect, ORDER_STATUS_OPTIONS } from '@/components/admin/StatusSelect'

<StatusSelect
  label="Status"
  value={status}
  onValueChange={(value) => setStatus(value)}
  options={ORDER_STATUS_OPTIONS}
/>
```

Pre-defined options are available:
- `ORDER_STATUS_OPTIONS` - Order statuses with matching table badge colors
- `PAYMENT_STATUS_OPTIONS` - Payment statuses with appropriate colors

## Security Notes

- Socket token is fetched via authenticated `/api/auth/socket-token` endpoint
- Admin users (ADMIN, SUPER_ADMIN) are excluded from receiving notifications
- Notifications are user-scoped - users can only see their own
