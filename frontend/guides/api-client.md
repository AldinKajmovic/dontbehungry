# API Client & Services

## Overview

The frontend uses Axios for HTTP requests to the backend API. Services are organized in a modular structure with reusable patterns for CRUD operations.

## Service Structure

```
services/
├── base/                    # Reusable utilities
│   ├── types.ts            # Common types (PaginatedResponse, SelectOption, etc.)
│   ├── crud.ts             # Generic CRUD helpers
│   └── index.ts
│
├── admin/                   # Admin service
│   ├── types.ts            # Admin-specific types
│   ├── service.ts          # Admin API methods
│   └── index.ts
│
├── auth/                    # Auth service
│   ├── types.ts            # Auth types
│   ├── service.ts          # Auth methods
│   └── index.ts
│
├── address/                 # Address service
│   ├── types.ts            # Address types
│   ├── service.ts          # Address methods
│   └── index.ts
│
├── profile/                 # Profile service
│   ├── types.ts            # Profile types
│   ├── service.ts          # Profile methods
│   └── index.ts
│
├── validation/              # Validation utilities
│   ├── schemas.ts          # Zod schemas
│   ├── helpers.ts          # Validation helper functions
│   └── index.ts
│
├── api.ts                   # Axios instance
└── index.ts                 # Main re-export
```

## Usage

### Import Services

```typescript
// Import from specific service
import { authService } from '@/services/auth'
import { profileService } from '@/services/profile'
import { adminService } from '@/services/admin'

// Import types
import type { User, AuthResponse } from '@/services/auth'
import type { AdminUser, PaginatedResponse } from '@/services/admin'

// Import everything (not recommended for tree-shaking)
import { authService, profileService, adminService } from '@/services'
```

### Basic API Usage

```typescript
import api from '@/services/api'

// GET request
const response = await api.get('/api/restaurants')
const restaurants = response.data

// POST request
const response = await api.post('/api/orders', {
  restaurantId: '...',
  items: [...]
})

// PATCH request
await api.patch('/api/profile', { firstName: 'John' })

// DELETE request
await api.delete('/api/addresses/123')
```

### With TypeScript Generics

```typescript
interface Restaurant {
  id: string
  name: string
  rating: number
}

const response = await api.get<Restaurant[]>('/api/restaurants')
const restaurants: Restaurant[] = response.data
```

## Base Utilities

### Common Types

```typescript
import { PaginatedResponse, SelectOption, MessageResponse } from '@/services/base'

interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface SelectOption {
  value: string
  label: string
}

interface MessageResponse {
  message: string
}
```

### CRUD Helpers

The base module provides reusable CRUD functions:

```typescript
import { createCrudService, createSelectLoader } from '@/services/base'

// Create a reusable CRUD service
const productsCrud = createCrudService<Product>('/api/products')

// Use it
const products = await productsCrud.getList({ page: 1, limit: 10, search: 'pizza' })
const product = await productsCrud.getById('123')
const newProduct = await productsCrud.create({ name: 'Pizza', price: 12.99 })
await productsCrud.update('123', { price: 14.99 })
await productsCrud.delete('123')

// Create a select loader for SearchableSelect component
const loadProducts = createSelectLoader(
  productsCrud.getList,
  (p) => p.id,
  (p) => p.name
)
const options = await loadProducts('search term')
```

## Available Services

| Service | Import | Purpose |
|---------|--------|---------|
| `authService` | `@/services/auth` | Authentication (login, register, logout, verify) |
| `profileService` | `@/services/profile` | Profile management (update, password, avatar, restaurants) |
| `addressService` | `@/services/address` | Address CRUD operations |
| `adminService` | `@/services/admin` | Admin panel operations |

## Service Examples

### Auth Service

```typescript
import { authService } from '@/services/auth'

// Login
const { user } = await authService.login({ email, password })

// Register
const { user } = await authService.register({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  password: 'securepass123'
})

// Get current user
const { user } = await authService.getCurrentUser()

// Logout
await authService.logout()

// Password reset
await authService.forgotPassword(email)
await authService.resetPassword(token, newPassword)
```

### Profile Service

```typescript
import { profileService } from '@/services/profile'

// Update profile
const response = await profileService.updateProfile({
  firstName: 'Jane',
  email: 'newemail@example.com'
})

// Change password
await profileService.changePassword({
  currentPassword: 'oldpass',
  newPassword: 'newpass123'
})

// Restaurant owner operations
const { restaurants } = await profileService.getMyRestaurants()
await profileService.createMyRestaurant({ name: 'My Restaurant', ... })
await profileService.updateMyRestaurant(id, { name: 'Updated Name' })
await profileService.deleteMyRestaurant(id)
```

### Admin Service

```typescript
import { adminService } from '@/services/admin'

// CRUD operations (same pattern for all entities)
const users = await adminService.getUsers(page, limit, search)
const user = await adminService.getUserById(id)
await adminService.createUser(data)
await adminService.updateUser(id, data)
await adminService.deleteUser(id)

// Select helpers for dropdowns
const userOptions = await adminService.getUsersForSelect(search)
const restaurantOptions = await adminService.getRestaurantsForSelect(search)
```

## Features

### Automatic Cookie Credentials

The client automatically sends HttpOnly cookies with all requests:

```typescript
// Credentials are sent automatically - no manual token handling
await api.get('/api/auth/me')
```

### Automatic Token Refresh

The response interceptor handles 401 errors by:
1. Attempting to refresh the access token via `/api/auth/refresh`
2. Retrying the original request with new tokens
3. Queuing concurrent requests while refresh is in progress
4. Dispatching `auth:logout` event if refresh fails

### Error Handling

The response interceptor extracts user-friendly error messages:

```typescript
try {
  await api.post('/api/orders', data)
} catch (error) {
  // error.message contains the user-friendly API error message
  console.error(error.message)
}
```

### Logout Event

When token refresh fails (session expired), the client dispatches a custom event:

```typescript
window.addEventListener('auth:logout', () => {
  // Clear user state and redirect to login
})
```

## Configuration

The base URL is configured via environment variable:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Default: `http://localhost:3001`

## Validation Utilities

```typescript
import { loginSchema, registerSchema, validateFieldValue } from '@/services/validation'

// Zod schema validation
const result = loginSchema.safeParse({ email, password })
if (!result.success) {
  // Handle validation errors
}

// Field validation helper
const error = validateFieldValue('email', value)
if (error) {
  setFieldError(error)
}
```

## Security Notes

- Tokens are stored in HttpOnly cookies (not accessible via JavaScript)
- Credentials are sent automatically with `withCredentials: true`
- Token refresh is handled server-side via cookies
- No sensitive data stored in localStorage

---

*Last updated: January 2026*
