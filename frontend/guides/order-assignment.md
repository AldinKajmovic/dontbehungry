# Driver Order Assignment UI

## Overview

A floating order queue system that allows delivery drivers to see, accept, and deny available orders in real-time. The UI consists of a fixed-position badge button and a slide-in panel accessible from any page.

## Components

### DriverOrderQueueOverlay (`components/driver/DriverOrderQueueOverlay.tsx`)

Root wrapper rendered in `app/layout.tsx`. Only renders for users with `DELIVERY_DRIVER` role. Contains the badge and panel.

### DriverOrderQueueBadge (`components/driver/DriverOrderQueueBadge.tsx`)

- Fixed-position FAB (bottom-right, z-50)
- Shows a delivery truck icon with a red badge counter
- Bounces briefly when a new order arrives
- Hidden when order count is 0
- Click opens the slide-in panel

### DriverOrderQueue (`components/driver/DriverOrderQueue.tsx`)

- Slide-in panel from the right (max-w-sm, full height, z-50)
- Header with title, order count, and close button
- Scrollable list of `DriverOrderQueueItem` cards
- Shows spinner during loading, empty state when no orders

### DriverOrderQueueItem (`components/driver/DriverOrderQueueItem.tsx`)

Each card displays:
- Restaurant name + time since order
- Pickup address (green dot) and delivery address (red dot)
- Total amount, item count, estimated distance
- **Accept** button (green, shows spinner when loading)
- **Deny** button (gray, shows inline "Are you sure?" confirmation before denying)

## Hook: useDriverOrderQueue

Located at `components/profile/hooks/useDriverOrderQueue.ts`.

### State
- `orders` — Array of available orders
- `orderCount` — Number of available orders
- `isLoading` — True during initial hydration
- `acceptingOrderId` — ID of order currently being accepted

### Socket Events Handled
- `order:available` — Adds order to queue (deduplicates)
- `order:accepted` — Removes order from queue
- `order:removed` — Removes order from queue

### Behavior
- **Hydration**: On mount + reconnect, calls `GET /api/profile/available-orders`
- **Accept**: Calls `POST /api/profile/orders/:orderId/accept`, removes from queue. On failure shows a differentiated toast:
  - `"You already have an active order"` → shows `driver.orderQueue.alreadyHaveOrder` toast
  - Other failures (order already taken) → shows `driver.orderQueue.alreadyTaken` toast
- **Deny**: Calls `POST /api/profile/orders/:orderId/deny`, removes from queue immediately (optimistic).
- **Offline**: Clears queue when socket disconnects.

## API Methods

Added to `ProfileService` in `services/profile/service.ts`:

| Method | Endpoint | Purpose |
|---|---|---|
| `getAvailableOrders()` | `GET /api/profile/available-orders` | Hydrate order queue |
| `acceptOrder(orderId)` | `POST /api/profile/orders/:orderId/accept` | Accept an order |
| `denyOrder(orderId)` | `POST /api/profile/orders/:orderId/deny` | Deny an order |

## Localization

Translation keys under `driver.orderQueue.*`:

| Key | EN | BA |
|---|---|---|
| `title` | Available Orders | Dostupne narudžbe |
| `empty` | No available orders right now | Trenutno nema dostupnih narudžbi |
| `accept` | Accept | Prihvati |
| `deny` | Deny | Odbij |
| `denyConfirm` | Are you sure? | Jeste li sigurni? |
| `accepting` | Accepting... | Prihvaćanje... |
| `accepted` | Order accepted! | Narudžba prihvaćena! |
| `alreadyTaken` | This order was already taken... | Ovu narudžbu je već preuzeo... |
| `alreadyHaveOrder` | You already have an active order | Već imate aktivnu narudžbu |
| `acceptError` | Failed to accept order... | Greška pri prihvaćanju narudžbe... |

## Types

Defined in `services/profile/types.ts`:

- `AvailableOrderEvent` — Order data received via socket/API
- `AcceptOrderResponse` — Response from accept endpoint
- `OrderAcceptedEvent` — Socket event when any driver accepts
- `OrderRemovedEvent` — Socket event when order is removed
- `AvailableOrdersResponse` — Response from available orders endpoint
