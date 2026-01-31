# Public API Guide

This guide documents the public API endpoints that do not require authentication.

## Overview

The public API provides read-only access to:
- Restaurant listings with filtering and pagination
- Restaurant details
- Menu items for a restaurant
- Categories

These endpoints are designed for the customer-facing restaurants page.

## Base Path

All public endpoints are prefixed with `/api/public`.

## Endpoints

### Get Restaurants

Returns a paginated list of restaurants with optional filtering.

```
GET /api/public/restaurants
```

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 12 | Items per page (max 50) |
| search | string | - | Search by name or description |
| sortBy | string | name | Sort field: name, rating, deliveryFee |
| sortOrder | string | asc | Sort direction: asc, desc |
| categoryId | string | - | Filter by category ID |
| minRating | number | - | Minimum rating filter |

#### Response

```typescript
{
  items: Array<{
    id: string
    name: string
    description: string | null
    logoUrl: string | null
    coverUrl: string | null
    rating: Decimal
    deliveryFee: Decimal | null
    minOrderAmount: Decimal | null
    categories: Array<{
      id: string
      restaurantId: string
      categoryId: string
      category: {
        id: string
        name: string
        description: string | null
        iconUrl: string | null
      }
    }>
    place: {
      city: string
      address: string
    }
  }>
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
```

#### Example

```bash
# Get first page of restaurants
GET /api/public/restaurants?page=1&limit=12

# Search for pizza restaurants
GET /api/public/restaurants?search=pizza

# Filter by category
GET /api/public/restaurants?categoryId=uuid-here

# Sort by rating descending
GET /api/public/restaurants?sortBy=rating&sortOrder=desc
```

---

### Get Restaurant by ID

Returns details for a single restaurant.

```
GET /api/public/restaurants/:id
```

#### Response

```typescript
{
  id: string
  name: string
  description: string | null
  logoUrl: string | null
  coverUrl: string | null
  rating: Decimal
  deliveryFee: Decimal | null
  minOrderAmount: Decimal | null
  phone: string | null
  email: string | null
  categories: Array<{
    id: string
    restaurantId: string
    categoryId: string
    category: {
      id: string
      name: string
      description: string | null
      iconUrl: string | null
    }
  }>
  place: {
    city: string
    address: string
    country: string
  }
  openingHours: Array<{
    id: string
    dayOfWeek: number
    openTime: string
    closeTime: string
    isClosed: boolean
  }>
}
```

#### Errors

- `404 Not Found` - Restaurant with given ID does not exist

---

### Get Restaurant Menu Items

Returns menu items for a restaurant, grouped by category.

```
GET /api/public/restaurants/:id/menu-items
```

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| categoryId | string | Optional filter by category ID |

#### Response

```typescript
Array<{
  categoryId: string
  categoryName: string
  items: Array<{
    id: string
    name: string
    description: string | null
    price: Decimal
    imageUrl: string | null
    preparationTime: number | null
    category: {
      id: string
      name: string
    } | null
  }>
}>
```

#### Notes

- Only returns items where `isAvailable = true`
- Items are grouped by category
- Items without a category are grouped under "Other"

#### Errors

- `404 Not Found` - Restaurant with given ID does not exist

---

### Get Categories

Returns all available food categories.

```
GET /api/public/categories
```

#### Response

```typescript
Array<{
  id: string
  name: string
  description: string | null
  iconUrl: string | null
}>
```

#### Notes

- Categories are sorted alphabetically by name

---

## Files

### Service

`/backend/src/services/public/restaurants.service.ts`

Contains all business logic for public restaurant queries:
- `getPublicRestaurants()` - List restaurants with filters
- `getPublicRestaurantById()` - Get single restaurant
- `getPublicCategories()` - Get all categories
- `getRestaurantMenuItems()` - Get menu items grouped by category

### Controller

`/backend/src/controllers/public.controller.ts`

Handles HTTP request/response:
- Parses query parameters
- Validates input types
- Returns JSON responses

### Routes

`/backend/src/routes/public.routes.ts`

Defines route mappings:
```typescript
router.get('/restaurants', publicController.getRestaurants)
router.get('/restaurants/:id', publicController.getRestaurantById)
router.get('/restaurants/:id/menu-items', publicController.getRestaurantMenuItems)
router.get('/categories', publicController.getCategories)
```

---

## Design Decisions

1. **No authentication required**: Public endpoints allow customers to browse restaurants before logging in
2. **Separate from admin API**: Public API returns limited fields (no owner info, no sensitive data)
3. **Menu items grouped by category**: Reduces client-side processing, ready for display
4. **Only available items**: `isAvailable = false` items are hidden from public view

---

*Last updated: January 2026*
