# Order Creation API

This guide documents the order creation endpoint for customers.

## Endpoint

```
POST /api/profile/orders
```

**Authentication:** Required (Customer role)

## Request Body

```json
{
  "restaurantId": "uuid",
  "deliveryAddressId": "uuid",
  "paymentMethod": "CASH" | "CREDIT_CARD",
  "notes": "optional order notes",
  "items": [
    {
      "menuItemId": "uuid",
      "quantity": 1,
      "notes": "optional item notes"
    }
  ]
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `restaurantId` | string (UUID) | Yes | ID of the restaurant |
| `deliveryAddressId` | string (UUID) | Yes | ID of user's saved address |
| `paymentMethod` | enum | Yes | CASH, CREDIT_CARD or DIGITAL_WALLET |
| `notes` | string | No | Special instructions for the order |
| `items` | array | Yes | At least one item required |
| `items[].menuItemId` | string (UUID) | Yes | ID of the menu item |
| `items[].quantity` | number | Yes | Must be >= 1 |
| `items[].notes` | string | No | Special instructions for item |

## Response

### Success (201 Created)

```json
{
  "message": "Order placed successfully",
  "order": {
    "id": "uuid",
    "status": "PENDING",
    "totalAmount": "25.99",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "restaurant": {
      "id": "uuid",
      "name": "Pizza Place"
    },
    "deliveryPlace": {
      "address": "123 Main St",
      "city": "New York"
    },
    "orderItems": [
      {
        "name": "Margherita Pizza",
        "quantity": 2,
        "unitPrice": "12.99"
      }
    ],
    "payment": {
      "status": "PENDING",
      "method": "CASH"
    }
  }
}
```

### Error Responses

**400 Bad Request** - Invalid input
```json
{
  "error": "Invalid items",
  "details": "Order must contain at least one item"
}
```

**404 Not Found** - Restaurant not found
```json
{
  "error": "Restaurant not found",
  "details": "The specified restaurant does not exist"
}
```

**404 Not Found** - Address not found
```json
{
  "error": "Address not found",
  "details": "The specified delivery address does not exist"
}
```

**401 Unauthorized** - Not authenticated
```json
{
  "error": "Unauthorized",
  "details": "User not authenticated"
}
```

## Business Logic

### Validation

1. **Restaurant Verification**
   - Must exist and be active
   - Used to get delivery fee and minimum order amount

2. **Address Verification**
   - Must belong to the authenticated user
   - Links to the Place table for delivery location

3. **Menu Items Verification**
   - All items must exist
   - All items must belong to the specified restaurant
   - All items must be available (`isAvailable: true`)

4. **Minimum Order Check**
   - If subtotal is below restaurant's `minOrderAmount`, a $5 small order fee is added
   - Orders are not rejected for being below minimum

### Order Calculation

```
subtotal = SUM(item.price * item.quantity)
deliveryFee = restaurant.deliveryFee (or 0)
tax = subtotal * 0.20 (20% tax)
minOrderFee = subtotal < minOrderAmount ? 5 : 0 ($5 small order fee)
totalAmount = subtotal + deliveryFee + tax + minOrderFee
```

### Database Operations

The order creation is done in a transaction:

1. Create `Order` record with:
   - userId (from auth)
   - restaurantId
   - deliveryPlaceId
   - status: PENDING
   - subtotal, deliveryFee, tax, totalAmount
   - notes (optional)

2. Create `OrderItem` records for each item:
   - orderId
   - menuItemId
   - quantity
   - unitPrice (from MenuItem at time of order)
   - totalPrice
   - notes (optional)

3. Create `Payment` record:
   - orderId
   - amount (totalAmount)
   - method (from request)
   - status: PENDING

## Payment Method

Payment is collected upon delivery. The payment method indicates how the customer intends to pay:

- **CASH**: Driver collects cash
- **CREDIT_CARD**: Driver has card terminal

The `Payment.status` starts as `PENDING` and is updated to `COMPLETED` when the driver confirms payment receipt.

## Driver Broadcast

After order creation, `broadcastOrderToNearbyDrivers(orderId)` is called as a fire-and-forget operation. This finds all online drivers within 10km of the restaurant and emits `order:available` via Socket.IO. Drivers can then accept or deny the order from their queue panel. See `backend/guides/order-assignment.md` for full details.

## Order Status Flow

```
PENDING → CONFIRMED → PREPARING → READY_FOR_PICKUP → OUT_FOR_DELIVERY → DELIVERED
                                                                      ↓
                                                                 CANCELLED
```

- `PENDING`: Initial status after order creation (driver assignment happens during this phase)
- `CONFIRMED`: Restaurant accepts the order
- `PREPARING`: Kitchen is preparing food
- `READY_FOR_PICKUP`: Food is ready for driver
- `OUT_FOR_DELIVERY`: Driver is on the way
- `DELIVERED`: Order completed
- `CANCELLED`: Order cancelled at any stage

## Service Implementation

Location: `/backend/src/services/profile.service.ts`

Key function: `createOrder(userId: string, data: CreateOrderData)`

The function:
1. Validates restaurant exists
2. Validates address belongs to user
3. Validates all menu items
4. Calculates totals
5. Creates order, items, and payment in transaction
6. Returns complete order with relations

## Controller Implementation

Location: `/backend/src/controllers/profile.controller.ts`

Key function: `createOrder(req, res, next)`

The controller:
1. Validates request body structure
2. Validates payment method enum
3. Validates items array structure
4. Calls service function
5. Returns 201 with order data

## Route Configuration

Location: `/backend/src/routes/profile.routes.ts`

```typescript
router.post('/orders', profileController.createOrder)
```

All profile routes require authentication middleware.
