# Admin API Documentation

## Overview

The Admin API provides CRUD operations for managing all entities in the system. Access is restricted to users with `ADMIN` or `SUPER_ADMIN` roles and optionally limited by IP whitelist.

## Security Architecture

All admin routes are protected by a security middleware stack:

1. **Authentication** (`authenticate`) - Validates JWT token
2. **Authorization** (`adminOnly`) - Requires ADMIN or SUPER_ADMIN role
3. **IP Whitelist** (`ipWhitelist`) - Restricts access by IP address
4. **Rate Limiting** (`adminLimiter`) - 100 requests per 15 minutes

## Configuration

### IP Whitelisting

Set the `ADMIN_WHITELISTED_IPS` environment variable with comma-separated IP addresses:

```bash
ADMIN_WHITELISTED_IPS=192.168.1.100,10.0.0.50,127.0.0.1
```

If this variable is empty or not set, all IPs are allowed (development mode).

**Security Note - Proxy Configuration:**

The IP whitelist uses the direct TCP socket connection address by default, which cannot be spoofed. If your application is behind a reverse proxy (nginx, AWS ALB, Cloudflare), you must configure Express to trust the proxy:

```typescript
// In app.ts
app.set('trust proxy', 1)  // Trust first proxy
```

Without this configuration, the middleware will see the proxy's IP, not the client's real IP. Only configure `trust proxy` when you're actually behind a trusted proxy.

## Base URL

All admin endpoints are prefixed with `/api/admin`.

## Authentication

Include the access token in cookies or as a Bearer token:

```
Authorization: Bearer <access_token>
```

## Common Response Format

### Success Response

```json
{
  "items": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  }
}
```

### Error Response

```json
{
  "error": "Error title",
  "details": "Detailed error message"
}
```

## Pagination Parameters

All list endpoints support:

| Parameter | Type | Default | Values |
|-----------|------|---------|--------|
| `page` | number | 1 | 1+ |
| `limit` | number | 10 | 5, 10, 25, 100 |
| `search` | string | - | Any search term |

## Endpoints

### Verify Access

Verify if the current user has admin access.

```
GET /api/admin/verify-access
```

**Response:**
```json
{
  "message": "Access verified",
  "authorized": true
}
```

### Dashboard Stats

Get overview statistics.

```
GET /api/admin/stats
```

**Response:**
```json
{
  "totalUsers": 150,
  "totalRestaurants": 25,
  "totalOrders": 1250,
  "totalRevenue": 45678.90
}
```

### Users

#### List Users

```
GET /api/admin/users?page=1&limit=10&search=john
```

#### Get User

```
GET /api/admin/users/:id
```

#### Create User

```
POST /api/admin/users
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "CUSTOMER"
}
```

**Roles:** `CUSTOMER`, `RESTAURANT_OWNER`, `DELIVERY_DRIVER`, `ADMIN`

#### Update User

```
PATCH /api/admin/users/:id
Content-Type: application/json

{
  "firstName": "Jane",
  "role": "ADMIN",
  "emailVerified": true
}
```

#### Delete User

```
DELETE /api/admin/users/:id
```

### User Addresses

Manage addresses for any user.

#### List User Addresses

```
GET /api/admin/users/:userId/addresses
```

**Response:**
```json
[
  {
    "id": "uuid-of-address",
    "address": "123 Main Street",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "postalCode": "10001",
    "notes": "Ring doorbell",
    "isDefault": true,
    "latitude": 40.7128,
    "longitude": -74.0060
  }
]
```

#### Add User Address

```
POST /api/admin/users/:userId/addresses
Content-Type: application/json

{
  "address": "123 Main Street",
  "city": "New York",
  "state": "NY",
  "country": "USA",
  "postalCode": "10001",
  "notes": "Ring doorbell",
  "isDefault": true,
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

#### Update User Address

```
PATCH /api/admin/users/:userId/addresses/:addressId
Content-Type: application/json

{
  "address": "456 Oak Avenue",
  "isDefault": true
}
```

#### Delete User Address

```
DELETE /api/admin/users/:userId/addresses/:addressId
```

### Restaurants

#### List Restaurants

```
GET /api/admin/restaurants?page=1&limit=10&search=pizza
```

#### Get Restaurant

```
GET /api/admin/restaurants/:id
```

#### Create Restaurant

```
POST /api/admin/restaurants
Content-Type: application/json

{
  "name": "Pizza Place",
  "description": "Best pizza in town",
  "phone": "+1234567890",
  "email": "pizza@example.com",
  "ownerId": "uuid-of-owner",
  "placeId": "uuid-of-place",
  "minOrderAmount": 15.00,
  "deliveryFee": 3.50,
  "logoUrl": "https://example.com/logo.jpg",     // optional
  "coverUrl": "https://example.com/cover.jpg",   // optional
  "openingHours": [                               // optional
    { "dayOfWeek": 0, "openTime": "09:00", "closeTime": "22:00", "isClosed": false },
    { "dayOfWeek": 6, "openTime": "00:00", "closeTime": "00:00", "isClosed": true }
  ],
  "galleryImages": [                              // optional, max 6
    { "imageUrl": "https://example.com/interior.jpg", "sortOrder": 0 }
  ]
}
```

**Opening Hours Validation:**
- Max 7 entries (one per day), `dayOfWeek` 0 (Monday) to 6 (Sunday)
- `openTime` and `closeTime` must be in `HH:mm` format
- No duplicate `dayOfWeek` values

**Gallery Images Validation:**
- Max 6 images, each with a valid `imageUrl` and integer `sortOrder`

#### Update Restaurant

```
PATCH /api/admin/restaurants/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description",
  "logoUrl": "https://example.com/new-logo.jpg",
  "coverUrl": "https://example.com/new-cover.jpg",
  "openingHours": [...],      // replaces all existing hours (delete-all + recreate)
  "galleryImages": [...]      // replaces all existing gallery images (old GCS files cleaned up)
}
```

#### Delete Restaurant

```
DELETE /api/admin/restaurants/:id
```

### Categories

#### List Categories

```
GET /api/admin/categories?page=1&limit=10&search=food
```

#### Get Category

```
GET /api/admin/categories/:id
```

#### Create Category

```
POST /api/admin/categories
Content-Type: application/json

{
  "name": "Italian",
  "description": "Italian cuisine",
  "iconUrl": "https://example.com/icon.png"
}
```

#### Update Category

```
PATCH /api/admin/categories/:id
```

#### Delete Category

```
DELETE /api/admin/categories/:id
```

### Menu Items

#### List Menu Items

```
GET /api/admin/menu-items?page=1&limit=10&search=burger
```

#### Get Menu Item

```
GET /api/admin/menu-items/:id
```

#### Create Menu Item

```
POST /api/admin/menu-items
Content-Type: application/json

{
  "name": "Margherita Pizza",
  "description": "Classic pizza with tomato and mozzarella",
  "price": 12.99,
  "imageUrl": "https://example.com/pizza.jpg",
  "restaurantId": "uuid-of-restaurant",
  "categoryId": "uuid-of-category",
  "isAvailable": true,
  "preparationTime": 20
}
```

#### Update Menu Item

```
PATCH /api/admin/menu-items/:id
```

#### Delete Menu Item

```
DELETE /api/admin/menu-items/:id
```

### Orders

#### List Orders

```
GET /api/admin/orders?page=1&limit=10&search=email@example.com
```

**Filter Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by order status |
| `paymentStatus` | string | Filter by payment status |
| `restaurantId` | UUID | Filter by restaurant |
| `customerId` | UUID | Filter by customer |
| `driverId` | UUID | Filter by assigned driver |
| `minTotalAmount` | number | Minimum order total |
| `maxTotalAmount` | number | Maximum order total |
| `createdAtFrom` | date | Filter orders from this date (inclusive, format: YYYY-MM-DD) |
| `createdAtTo` | date | Filter orders until this date (inclusive, format: YYYY-MM-DD) |

**Sorting Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sortBy` | string | Sort field: `status`, `totalAmount`, `subtotal`, `createdAt` |
| `sortOrder` | string | Sort direction: `asc` or `desc` (default: `createdAt desc`) |

**Example with filters:**
```
GET /api/admin/orders?status=PENDING&createdAtFrom=2026-01-01&createdAtTo=2026-01-31&sortBy=createdAt&sortOrder=asc
```

#### Get Order

```
GET /api/admin/orders/:id
```

#### Create Order

```
POST /api/admin/orders
Content-Type: application/json

{
  "userId": "uuid-of-customer",
  "restaurantId": "uuid-of-restaurant",
  "deliveryPlaceId": "uuid-of-place",
  "driverId": "uuid-of-driver",        // optional, defaults to unassigned
  "status": "PENDING",                  // optional, defaults to PENDING
  "subtotal": 25.99,
  "deliveryFee": 3.50,                  // optional
  "tax": 2.60,                          // optional
  "notes": "Special instructions"       // optional
}
```

**Note:** Total amount is calculated automatically as `subtotal + deliveryFee + tax`.

#### Update Order

```
PATCH /api/admin/orders/:id
Content-Type: application/json

{
  "status": "DELIVERED",
  "driverId": "uuid-of-driver",  // set to null or empty string to unassign
  "notes": "Left at door"
}
```

**Statuses:** `PENDING`, `CONFIRMED`, `PREPARING`, `READY_FOR_PICKUP`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`

#### Delete Order

```
DELETE /api/admin/orders/:id
```

### Reviews

#### List Reviews

```
GET /api/admin/reviews?page=1&limit=10&search=great
```

#### Get Review

```
GET /api/admin/reviews/:id
```

#### Create Review

```
POST /api/admin/reviews
Content-Type: application/json

{
  "userId": "uuid-of-user",
  "restaurantId": "uuid-of-restaurant",
  "rating": 5,
  "title": "Amazing food!",
  "content": "The pizza was delicious."
}
```

#### Update Review

```
PATCH /api/admin/reviews/:id
```

#### Delete Review

```
DELETE /api/admin/reviews/:id
```

### Places

#### List Places

```
GET /api/admin/places?page=1&limit=10&search=new york
```

#### Get Place

```
GET /api/admin/places/:id
```

#### Create Place

```
POST /api/admin/places
Content-Type: application/json

{
  "address": "123 Main Street",
  "city": "New York",
  "state": "NY",
  "country": "USA",
  "postalCode": "10001"
}
```

#### Update Place

```
PATCH /api/admin/places/:id
```

#### Delete Place

```
DELETE /api/admin/places/:id
```

### Payments

Payments can only be viewed and updated (no create/delete).

#### List Payments

```
GET /api/admin/payments?page=1&limit=10&search=order-id
```

#### Get Payment

```
GET /api/admin/payments/:id
```

#### Update Payment

```
PATCH /api/admin/payments/:id
Content-Type: application/json

{
  "status": "COMPLETED"
}
```

**Statuses:** `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Not an admin or IP not whitelisted |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate entry |
| 429 | Too Many Requests - Rate limit exceeded |

## Image Upload

Admin entity updates that include image fields (`avatarUrl`, `logoUrl`, `coverUrl`, `imageUrl`, `iconUrl`) will automatically clean up old GCS images when replaced. Use the shared upload endpoint to get image URLs:

```
POST /api/upload?type=avatar|restaurant-logo|restaurant-cover|menu-item|category-icon[&entityId=xxx]
DELETE /api/upload  (body: { url: string })
```

See [image-upload.md](./image-upload.md) for full details.

## Files

- `backend/src/routes/admin.routes.ts` - Route definitions
- `backend/src/controllers/admin.controller.ts` - Request handlers
- `backend/src/services/admin.service.ts` - Business logic
- `backend/src/validators/admin.validator.ts` - Input validation
- `backend/src/middlewares/ipWhitelist.middleware.ts` - IP filtering
- `backend/src/middlewares/adminOnly.middleware.ts` - Role check
