# Restaurant Order Management

This guide documents how restaurant owners can manage their orders.

## View Orders

Restaurant owners can view all orders for their restaurants through the My Profile page.

### Endpoint

```
GET /api/profile/my-restaurants/:restaurantId/orders
```

**Authentication:** Required (RESTAURANT_OWNER role)

**Query Parameters:**
- `status` - Filter by order status
- `createdAtFrom` - Filter from date (ISO format)
- `createdAtTo` - Filter to date (ISO format)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

## Update Order Status

Restaurant owners can update the status of orders for their restaurants.

### Endpoint

```
PATCH /api/profile/my-restaurants/:restaurantId/orders/:orderId
```

**Authentication:** Required (RESTAURANT_OWNER role)

### Request Body

```json
{
  "status": "CONFIRMED",
  "notes": "optional notes"
}
```

### Valid Statuses

| Status | Description |
|--------|-------------|
| `PENDING` | Order received, awaiting confirmation |
| `CONFIRMED` | Restaurant accepted the order |
| `PREPARING` | Kitchen is preparing the food |
| `READY_FOR_PICKUP` | Food is ready for delivery driver |
| `OUT_FOR_DELIVERY` | Driver has picked up the order |
| `DELIVERED` | Order completed successfully |
| `CANCELLED` | Order was cancelled |

### Response

**Success (200 OK):**
```json
{
  "message": "Order status updated successfully",
  "order": {
    "id": "uuid",
    "status": "CONFIRMED"
  }
}
```

**Error (404 Not Found):**
```json
{
  "error": "Order not found",
  "details": "This order does not belong to your restaurant"
}
```

## Typical Order Flow

1. **Customer places order** → Status: `PENDING`
2. **Restaurant confirms** → Status: `CONFIRMED`
3. **Kitchen starts cooking** → Status: `PREPARING`
4. **Food is ready** → Status: `READY_FOR_PICKUP`
5. **Driver picks up** → Status: `OUT_FOR_DELIVERY`
6. **Customer receives order** → Status: `DELIVERED`

At any point, the order can be moved to `CANCELLED` if needed.

## Frontend UI

Restaurant owners can change order status directly from the order card using a dropdown selector:

1. Go to **My Profile** page
2. In the **My Restaurants** section, click **View Orders** on a restaurant card
3. Each order shows a status dropdown
4. Select a new status to update the order

**Note:** Orders with status `DELIVERED` or `CANCELLED` cannot be changed (dropdown is disabled).

## Authorization

- Only the restaurant owner can update orders for their restaurants
- The backend verifies:
  1. User is authenticated
  2. User has RESTAURANT_OWNER role
  3. User owns the specified restaurant
  4. Order belongs to that restaurant

## Payment Handling

When an order is marked as `DELIVERED`:
- The `deliveredAt` timestamp is automatically set
- Payment status should be updated separately when payment is collected

Payment is collected upon delivery, so the Payment record remains `PENDING` until the driver confirms receipt.
