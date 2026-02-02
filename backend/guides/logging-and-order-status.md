# Logging and Order Status Utilities

This document describes the logging utility and order status validation utilities added for improved observability and data integrity.

---

## Logger Utility

**Location:** `backend/src/utils/logger.ts`

A structured logging utility that provides consistent log formatting and environment-aware log levels.

### Log Levels

| Level | Production | Development |
|-------|-----------|-------------|
| debug | Hidden | Visible |
| info | Visible | Visible |
| warn | Visible | Visible |
| error | Visible | Visible |

### Usage

```typescript
import { logger } from '../utils/logger'

// Debug logs (hidden in production)
logger.debug('User connected', { userId, socketId })

// Info logs
logger.info('Server running on http://localhost:3001')

// Warning logs
logger.warn('Rate limit approaching', { userId, requestCount })

// Error logs with error object and context
logger.error('Failed to create notification', error, { orderId, userId })
```

### Output Format

```
[2026-02-02T10:30:45.123Z] [INFO] Server running on http://localhost:3001
[2026-02-02T10:30:46.456Z] [ERROR] Failed to create notification {"orderId":"abc123","errorMessage":"User not found"}
```

---

## Order Status Validator

**Location:** `backend/src/utils/orderStatus.ts`

A state machine validator that ensures order status transitions follow valid business rules.

### Valid Order Statuses

- `PENDING` - Order created, awaiting confirmation
- `CONFIRMED` - Restaurant confirmed the order
- `PREPARING` - Restaurant is preparing the order
- `READY_FOR_PICKUP` - Order ready for driver pickup
- `OUT_FOR_DELIVERY` - Driver is delivering the order
- `DELIVERED` - Order delivered (terminal state)
- `CANCELLED` - Order cancelled (terminal state)

### Valid Transitions

```
PENDING → CONFIRMED, CANCELLED
CONFIRMED → PREPARING, CANCELLED
PREPARING → READY_FOR_PICKUP, CANCELLED
READY_FOR_PICKUP → OUT_FOR_DELIVERY, CANCELLED
OUT_FOR_DELIVERY → DELIVERED, CANCELLED
DELIVERED → (none - terminal)
CANCELLED → (none - terminal)
```

### Usage

```typescript
import { validateStatusTransition, getNextValidStatuses, isValidOrderStatus } from '../utils/orderStatus'

// Validate a transition (throws BadRequestError if invalid)
validateStatusTransition('PENDING', 'CONFIRMED') // OK
validateStatusTransition('PENDING', 'DELIVERED') // Throws error

// Admin override mode (allows non-standard transitions except from terminal states)
validateStatusTransition('CONFIRMED', 'PENDING', true) // OK with admin override
validateStatusTransition('DELIVERED', 'PENDING', true) // Still throws - terminal state

// Get valid next statuses
const nextStatuses = getNextValidStatuses('PREPARING')
// Returns: ['READY_FOR_PICKUP', 'CANCELLED']

// Check if status is valid
isValidOrderStatus('PREPARING') // true
isValidOrderStatus('INVALID') // false
```

### Where Validation is Applied

- **Restaurant Owner Updates:** `profile.service.ts` - `updateRestaurantOrderStatus()`
  - Uses strict validation (no admin override)

- **Admin Updates:** `admin/orders.service.ts` - `updateOrder()`
  - Uses admin override (can skip intermediate states, but cannot modify terminal states)

---

## Rate Limiting

### Socket Token Endpoint

**Location:** `backend/src/middlewares/rateLimiter.ts`

The `/api/auth/socket-token` endpoint is rate limited to prevent abuse:

- **Window:** 1 minute
- **Max requests:** 10 per user
- **Response on limit:** 429 Too Many Requests

```typescript
// Applied in auth.routes.ts
router.get('/socket-token', authenticate, socketTokenLimiter, authController.getSocketToken)
```
