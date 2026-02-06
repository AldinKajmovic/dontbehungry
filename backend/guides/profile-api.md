# Profile API

This document describes the Profile API endpoints for managing user profile information.

## Overview

The Profile API allows authenticated users to:
- Update their basic profile information (name, phone, email)
- Change their password
- Update their avatar URL
- Delete their account
- Manage their restaurants (restaurant owners only)

All endpoints require authentication via JWT token.

## Endpoints

### Update Profile

Updates the user's basic profile information including email.

**Endpoint:** `PATCH /api/profile`

**Authentication:** Required

**Request Body:**
```json
{
  "firstName": "string (optional)",
  "lastName": "string (optional)",
  "phone": "string (optional)",
  "email": "string (optional)"
}
```

**Validation Rules:**
- `firstName`: Cannot be empty if provided, max 50 characters
- `lastName`: Cannot be empty if provided, max 50 characters
- `phone`: Max 20 characters, can be null to remove
- `email`: Must be valid email format, must not be taken by another user

**Response:**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "role": "CUSTOMER",
    "emailVerified": true,
    "phoneVerified": false,
    "avatarUrl": null
  },
  "emailChanged": false
}
```

**Email Change Behavior:**
- When email is changed, `emailVerified` is set to `false`
- **All existing sessions are revoked** (user must re-login)
- A verification email is sent to the new email address
- Response includes `emailChanged: true` to notify the frontend

---

### Change Password

Changes the user's password. Only available for users with local authentication (not Google OAuth).

**Endpoint:** `POST /api/profile/change-password`

**Authentication:** Required

**Rate Limited:** Yes (sensitive operation limiter)

**Request Body:**
```json
{
  "currentPassword": "string (required)",
  "newPassword": "string (required)"
}
```

**Validation Rules:**
- `currentPassword`: Required
- `newPassword`: Required, minimum 8 characters, must be different from current password

**Response:**
```json
{
  "message": "Password changed successfully. Please log in again on other devices."
}
```

**Side Effects:**
- All existing refresh tokens for the user are revoked (logout from all devices)

**Error Responses:**
- `400 Bad Request` - Missing fields or same password
- `401 Unauthorized` - Current password is incorrect
- `400 Bad Request` - Account uses social login (no password set)

---

### Update Avatar

Updates the user's avatar URL.

**Endpoint:** `PATCH /api/profile/avatar`

**Authentication:** Required

**Request Body:**
```json
{
  "avatarUrl": "string | null"
}
```

**Validation Rules:**
- `avatarUrl`: Must be a valid URL with `http://` or `https://` protocol
- Other protocols (`javascript:`, `data:`, etc.) are rejected for security

**Response:**
```json
{
  "message": "Avatar updated successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "role": "CUSTOMER",
    "emailVerified": true,
    "phoneVerified": false,
    "avatarUrl": "https://example.com/avatar.jpg"
  }
}
```

---

### Delete Account

Permanently deletes the user's account and all associated data.

**Endpoint:** `DELETE /api/profile`

**Authentication:** Required

**Response:**
```json
{
  "message": "Account deleted successfully"
}
```

**Side Effects:**
- All user data is permanently deleted (cascading delete)
- All refresh tokens are invalidated
- Auth cookies are cleared

---

## Restaurant Owner Endpoints

These endpoints are available for users with `RESTAURANT_OWNER` role to manage their restaurants.

### Get My Restaurants

Returns all restaurants owned by the authenticated user.

**Endpoint:** `GET /api/profile/my-restaurants`

**Authentication:** Required

**Response:**
```json
{
  "restaurants": [
    {
      "id": "uuid",
      "name": "My Restaurant",
      "description": "A great place to eat",
      "phone": "+1234567890",
      "email": "restaurant@example.com",
      "logoUrl": null,
      "coverUrl": null,
      "rating": "4.5",
      "minOrderAmount": "15.00",
      "deliveryFee": "3.50",
      "place": {
        "id": "uuid",
        "address": "123 Main Street",
        "city": "New York",
        "country": "USA"
      }
    }
  ]
}
```

---

### Create My Restaurant

Creates a new restaurant for the authenticated user.

**Endpoint:** `POST /api/profile/my-restaurants`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "string (required)",
  "description": "string (optional)",
  "phone": "string (optional)",
  "email": "string (optional)",
  "address": "string (required)",
  "city": "string (required)",
  "country": "string (required)",
  "postalCode": "string (optional)",
  "minOrderAmount": "number (optional)",
  "deliveryFee": "number (optional)"
}
```

**Validation Rules:**
- `name`: Required, non-empty
- `address`: Required, non-empty
- `city`: Required, non-empty
- `country`: Required, non-empty
- `minOrderAmount`: Must be a positive number if provided
- `deliveryFee`: Must be a positive number if provided

**Response:**
```json
{
  "message": "Restaurant created successfully",
  "restaurant": {
    "id": "uuid",
    "name": "My Restaurant",
    "description": "A great place to eat",
    "phone": "+1234567890",
    "email": "restaurant@example.com",
    "logoUrl": null,
    "coverUrl": null,
    "rating": "0.0",
    "minOrderAmount": "15.00",
    "deliveryFee": "3.50",
    "place": {
      "id": "uuid",
      "address": "123 Main Street",
      "city": "New York",
      "country": "USA"
    }
  }
}
```

**Side Effects:**
- Creates a new Place record with the provided address
- Creates a new Restaurant linked to the user and place

---

### Update My Restaurant

Updates an existing restaurant owned by the authenticated user.

**Endpoint:** `PATCH /api/profile/my-restaurants/:id`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "string (optional)",
  "description": "string | null (optional)",
  "phone": "string | null (optional)",
  "email": "string | null (optional)",
  "minOrderAmount": "number | null (optional)",
  "deliveryFee": "number | null (optional)"
}
```

**Note:** Location (place) cannot be updated through this endpoint. Contact admin if location change is needed.

**Response:**
```json
{
  "message": "Restaurant updated successfully",
  "restaurant": { ... }
}
```

**Error Responses:**
- `404 Not Found` - Restaurant not found or not owned by user

---

### Delete My Restaurant

Deletes a restaurant owned by the authenticated user.

**Endpoint:** `DELETE /api/profile/my-restaurants/:id`

**Authentication:** Required

**Response:**
```json
{
  "message": "Restaurant deleted successfully"
}
```

**Error Responses:**
- `404 Not Found` - Restaurant not found or not owned by user

**Side Effects:**
- Restaurant and all related data (menu items, orders, reviews) are deleted (cascade)

---

### Get Restaurant Orders

Returns paginated orders for a specific restaurant owned by the authenticated user.

**Endpoint:** `GET /api/profile/my-restaurants/:restaurantId/orders`

**Authentication:** Required (must have RESTAURANT_OWNER role)

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by order status (PENDING, CONFIRMED, PREPARING, READY_FOR_PICKUP, OUT_FOR_DELIVERY, DELIVERED, CANCELLED) |
| `createdAtFrom` | ISO date string | Filter orders created on or after this date |
| `createdAtTo` | ISO date string | Filter orders created on or before this date |
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Items per page (default: 10, max: 100) |

**Example Request:**
```
GET /api/profile/my-restaurants/abc123/orders?status=PENDING&page=1&limit=5
```

**Response:**
```json
{
  "orders": [
    {
      "id": "uuid",
      "status": "PENDING",
      "totalAmount": "45.99",
      "createdAt": "2025-06-15T14:30:00.000Z",
      "deliveredAt": null,
      "restaurant": {
        "id": "uuid",
        "name": "My Restaurant"
      },
      "deliveryPlace": {
        "address": "123 Main Street",
        "city": "New York"
      },
      "orderItems": [
        {
          "name": "Margherita Pizza",
          "quantity": 2,
          "unitPrice": "15.99"
        }
      ],
      "payment": {
        "status": "COMPLETED",
        "method": "CREDIT_CARD"
      },
      "customerName": "John Doe",
      "customerPhone": "+1234567890"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 25,
    "totalPages": 5
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid date format or status value
- `403 Forbidden` - User is not a restaurant owner
- `404 Not Found` - Restaurant not found or not owned by user

---

## Menu Items Endpoints (Restaurant Owners)

These endpoints allow restaurant owners to manage menu items for their restaurants.

### Get Menu Items

Returns all menu items for a specific restaurant.

**Endpoint:** `GET /api/profile/my-restaurants/:restaurantId/menu-items`

**Authentication:** Required

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Margherita Pizza",
      "description": "Classic pizza with tomato and mozzarella",
      "price": "15.99",
      "imageUrl": "https://example.com/pizza.jpg",
      "isAvailable": true,
      "preparationTime": 20,
      "category": {
        "id": "uuid",
        "name": "Pizza"
      }
    }
  ]
}
```

---

### Create Menu Item

Creates a new menu item for a restaurant.

**Endpoint:** `POST /api/profile/my-restaurants/:restaurantId/menu-items`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "string (required)",
  "description": "string (optional)",
  "price": "number (required)",
  "imageUrl": "string (optional)",
  "categoryId": "string (optional)",
  "isAvailable": "boolean (optional, default: true)",
  "preparationTime": "number (optional, minutes)"
}
```

**Validation Rules:**
- `name`: Required, non-empty
- `price`: Required, must be a non-negative number
- `preparationTime`: Must be a non-negative integer if provided

**Response:**
```json
{
  "message": "Menu item created successfully",
  "item": { ... }
}
```

**Error Responses:**
- `404 Not Found` - Restaurant or category not found

---

### Update Menu Item

Updates an existing menu item.

**Endpoint:** `PATCH /api/profile/my-restaurants/:restaurantId/menu-items/:itemId`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "string (optional)",
  "description": "string | null (optional)",
  "price": "number (optional)",
  "imageUrl": "string | null (optional)",
  "categoryId": "string | null (optional)",
  "isAvailable": "boolean (optional)",
  "preparationTime": "number | null (optional)"
}
```

**Response:**
```json
{
  "message": "Menu item updated successfully",
  "item": { ... }
}
```

**Error Responses:**
- `404 Not Found` - Restaurant, menu item, or category not found

---

### Delete Menu Item

Deletes a menu item from a restaurant.

**Endpoint:** `DELETE /api/profile/my-restaurants/:restaurantId/menu-items/:itemId`

**Authentication:** Required

**Response:**
```json
{
  "message": "Menu item deleted successfully"
}
```

**Error Responses:**
- `404 Not Found` - Restaurant or menu item not found

---

### Get Categories

Returns all available categories for menu items.

**Endpoint:** `GET /api/profile/categories`

**Authentication:** Required

**Response:**
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Pizza"
    },
    {
      "id": "uuid",
      "name": "Burgers"
    }
  ]
}
```

---

## Address Management API

### Get All Addresses

**Endpoint:** `GET /api/addresses`

**Authentication:** Required

**Response:**
```json
{
  "addresses": [
    {
      "id": "uuid",
      "address": "123 Main Street",
      "city": "New York",
      "state": "NY",
      "country": "USA",
      "postalCode": "10001",
      "notes": "Ring doorbell",
      "isDefault": true
    }
  ]
}
```

### Add Address

**Endpoint:** `POST /api/addresses`

**Request Body:**
```json
{
  "address": "string (required)",
  "city": "string (required)",
  "country": "string (required)",
  "state": "string (optional)",
  "postalCode": "string (optional)",
  "notes": "string (optional)",
  "isDefault": "boolean (optional)"
}
```

**Response:**
```json
{
  "message": "Address added successfully",
  "address": { ... }
}
```

### Update Address

**Endpoint:** `PATCH /api/addresses/:id`

**Request Body:** Same as Add Address (all fields optional)

**Response:**
```json
{
  "message": "Address updated successfully",
  "address": { ... }
}
```

### Delete Address

**Endpoint:** `DELETE /api/addresses/:id`

**Response:**
```json
{
  "message": "Address deleted successfully"
}
```

### Set Default Address

**Endpoint:** `POST /api/addresses/:id/default`

**Response:**
```json
{
  "message": "Default address updated",
  "address": { ... }
}
```

## Order History Endpoints

These endpoints allow users to view their order history.

### Get My Order History (Customers)

Returns paginated order history for the authenticated user.

**Endpoint:** `GET /api/profile/my-orders`

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `createdAtFrom` | ISO date string | Filter orders created on or after this date |
| `createdAtTo` | ISO date string | Filter orders created on or before this date |
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Items per page (default: 10, max: 100) |

**Example Request:**
```
GET /api/profile/my-orders?createdAtFrom=2025-01-01&createdAtTo=2025-12-31&page=1&limit=5
```

**Response:**
```json
{
  "orders": [
    {
      "id": "uuid",
      "status": "DELIVERED",
      "totalAmount": "45.99",
      "createdAt": "2025-06-15T14:30:00.000Z",
      "deliveredAt": "2025-06-15T15:15:00.000Z",
      "restaurant": {
        "id": "uuid",
        "name": "Pizza Palace"
      },
      "deliveryPlace": {
        "address": "123 Main Street",
        "city": "New York"
      },
      "orderItems": [
        {
          "name": "Margherita Pizza",
          "quantity": 2,
          "unitPrice": "15.99"
        }
      ],
      "payment": {
        "status": "COMPLETED",
        "method": "CREDIT_CARD"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 25,
    "totalPages": 5
  }
}
```

---

### Get Driver Order History (Delivery Drivers)

Returns paginated order history for assigned deliveries.

**Endpoint:** `GET /api/profile/driver-orders`

**Authentication:** Required (must have DELIVERY_DRIVER role)

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by order status (PENDING, CONFIRMED, PREPARING, READY_FOR_PICKUP, OUT_FOR_DELIVERY, DELIVERED, CANCELLED) |
| `createdAtFrom` | ISO date string | Filter orders created on or after this date |
| `createdAtTo` | ISO date string | Filter orders created on or before this date |
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Items per page (default: 10, max: 100) |

**Example Request:**
```
GET /api/profile/driver-orders?status=DELIVERED&page=1&limit=5
```

**Response:**
```json
{
  "orders": [
    {
      "id": "uuid",
      "status": "DELIVERED",
      "totalAmount": "45.99",
      "createdAt": "2025-06-15T14:30:00.000Z",
      "deliveredAt": "2025-06-15T15:15:00.000Z",
      "restaurant": {
        "id": "uuid",
        "name": "Pizza Palace"
      },
      "deliveryPlace": {
        "address": "123 Main Street",
        "city": "New York"
      },
      "orderItems": [
        {
          "name": "Margherita Pizza",
          "quantity": 2,
          "unitPrice": "15.99"
        }
      ],
      "payment": {
        "status": "COMPLETED",
        "method": "CREDIT_CARD"
      },
      "customerFirstName": "John"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 50,
    "totalPages": 10
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid date format or status value
- `403 Forbidden` - User is not a delivery driver

---

## Driver Order Assignment Endpoints

These endpoints allow delivery drivers to view, accept, and deny available orders. See `backend/guides/order-assignment.md` for full architecture details.

### Get Available Orders

Returns PENDING orders within 10km that the driver hasn't denied.

**Endpoint:** `GET /api/profile/available-orders`

**Authentication:** Required (must have DELIVERY_DRIVER role)

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

### Accept Order

Atomically assigns the order to the driver. Returns 409 if already taken by another driver.

**Endpoint:** `POST /api/profile/orders/:orderId/accept`

**Authentication:** Required (must have DELIVERY_DRIVER role)

**Success Response (200):**
```json
{ "success": true, "message": "Order accepted successfully" }
```

**Conflict Response (409):**
```json
{ "success": false, "message": "Order is no longer available" }
```

### Deny Order

Records a denial. The order remains available for other drivers. Idempotent.

**Endpoint:** `POST /api/profile/orders/:orderId/deny`

**Authentication:** Required (must have DELIVERY_DRIVER role)

**Response:**
```json
{ "message": "Order denied" }
```

---

## Driver Availability Endpoints

These endpoints allow delivery drivers to manage their work status and view hours worked.

### Toggle Availability

Toggles the driver's availability status (online/offline).

**Endpoint:** `POST /api/profile/availability/toggle`

**Authentication:** Required (must have DELIVERY_DRIVER role)

**Response (Going Online):**
```json
{
  "message": "You are now online",
  "isOnline": true,
  "currentShift": {
    "id": "uuid",
    "startTime": "2025-01-15T09:00:00.000Z",
    "elapsedMinutes": 0
  }
}
```

**Response (Going Offline):**
```json
{
  "message": "You are now offline",
  "isOnline": false,
  "currentShift": null
}
```

**Note:** When going offline, the shift end time is automatically adjusted based on the driver's last delivery. If the last delivery was more than 10 minutes before the toggle, the shift ends at the last delivery time.

**Error Responses:**
- `403 Forbidden` - User is not a delivery driver
- `404 Not Found` - User not found

---

### Get Availability Status

Returns the driver's current availability status.

**Endpoint:** `GET /api/profile/availability/status`

**Authentication:** Required (must have DELIVERY_DRIVER role)

**Response:**
```json
{
  "isOnline": true,
  "currentShift": {
    "id": "uuid",
    "startTime": "2025-01-15T09:00:00.000Z",
    "elapsedMinutes": 45
  }
}
```

**Error Responses:**
- `403 Forbidden` - User is not a delivery driver
- `404 Not Found` - User not found

---

### Get Monthly Hours

Returns aggregated hours worked per month.

**Endpoint:** `GET /api/profile/availability/hours`

**Authentication:** Required (must have DELIVERY_DRIVER role)

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `months` | integer | Number of months to retrieve (1-12, default: 6) |

**Response:**
```json
{
  "months": [
    {
      "month": "2025-01",
      "year": 2025,
      "monthNumber": 1,
      "monthName": "January",
      "totalMinutes": 2400,
      "totalHours": 40,
      "shiftCount": 12
    }
  ],
  "totalMinutes": 14400,
  "totalHours": 240
}
```

**Error Responses:**
- `400 Bad Request` - Invalid months parameter (must be 1-12)
- `403 Forbidden` - User is not a delivery driver
- `404 Not Found` - User not found

---

## File Structure

```
backend/src/
├── controllers/
│   ├── profile.controller.ts    # Profile HTTP request handlers
│   └── address.controller.ts    # Address HTTP request handlers
├── services/
│   ├── profile.service.ts       # Profile & restaurant business logic
│   └── address.service.ts       # Address business logic
├── routes/
│   ├── profile.routes.ts        # Profile route definitions
│   └── address.routes.ts        # Address route definitions
├── validators/profile.validator.ts  # Input validation
├── utils/sanitize.ts            # Input sanitization (XSS prevention)
└── types/index.ts               # Types and interfaces
```

## Security Considerations

1. **Authentication**: All endpoints require a valid JWT access token
2. **Rate Limiting**: Password change endpoint has additional rate limiting
3. **Token Revocation**: Changing password or email revokes all refresh tokens (forces re-login on all devices)
4. **Input Validation**: All inputs are validated before processing
5. **Input Length Limits**: All string fields have maximum length limits to prevent DoS attacks
6. **Input Sanitization**: Address fields are sanitized using `sanitize-html` library to prevent XSS attacks (strips all HTML tags)
7. **URL Validation**: Avatar URLs are validated to only allow `http://` and `https://` protocols (prevents `javascript:` injection)
8. **Role Protection**: Users cannot change their own role through these endpoints
9. **Ownership Check**: Restaurant and address operations verify ownership by the requesting user
10. **Safe Deletion**: Place records are only deleted if no other entities reference them

## Usage Example

```typescript
// Frontend service usage
import { profileService } from '@/services/profile'
import { addressService } from '@/services/address'

// Update profile (including email change)
const response = await profileService.updateProfile({
  firstName: 'Jane',
  lastName: 'Smith',
  phone: '+1987654321',
  email: 'newemail@example.com'
})

if (response.emailChanged) {
  // Notify user to verify new email
}

// Change password
await profileService.changePassword({
  currentPassword: 'oldPassword123',
  newPassword: 'newSecurePassword456'
})

// Restaurant owner operations
const { restaurants } = await profileService.getMyRestaurants()

await profileService.createMyRestaurant({
  name: 'My New Restaurant',
  address: '456 Oak Avenue',
  city: 'Los Angeles',
  country: 'USA',
  minOrderAmount: 20,
  deliveryFee: 5
})

await profileService.updateMyRestaurant(restaurantId, {
  description: 'Updated description',
  minOrderAmount: 25
})

await profileService.deleteMyRestaurant(restaurantId)

// Address management
const { addresses } = await addressService.getAddresses()

await addressService.addAddress({
  address: '123 Main St',
  city: 'New York',
  country: 'USA',
  isDefault: true
})

await addressService.setDefaultAddress(addressId)
await addressService.deleteAddress(addressId)

// Order history (for customers)
const orderHistory = await profileService.getMyOrderHistory({
  createdAtFrom: '2025-01-01',
  createdAtTo: '2025-12-31',
  page: 1,
  limit: 10
})

// Driver deliveries (for delivery drivers)
const driverDeliveries = await profileService.getDriverOrderHistory({
  status: 'DELIVERED',
  page: 1,
  limit: 10
})
```

---

*Last updated: February 2026*
