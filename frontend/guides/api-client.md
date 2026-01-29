# API Client (Axios)

## Overview

The frontend uses Axios for HTTP requests to the backend API. The client is configured with interceptors for authentication and error handling.

## Location

`services/api.ts`

## Usage

### Basic Usage

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

// PUT request
await api.put('/api/users/profile', { firstName: 'John' })

// DELETE request
await api.delete('/api/orders/123')
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

## Features

### Automatic Auth Token

The request interceptor automatically attaches the JWT token from localStorage:

```typescript
// No need to manually add Authorization header
await api.get('/api/auth/me')
// Automatically sends: Authorization: Bearer <token>
```

### Error Handling

The response interceptor:
- Extracts error messages from API responses
- Handles 401 (unauthorized) by clearing the session
- Returns a standardized Error object

```typescript
try {
  await api.post('/api/orders', data)
} catch (error) {
  // error.message contains the API error message
  console.error(error.message)
}
```

### 401 Handling

When a 401 response is received:
1. Token and user data are cleared from localStorage
2. User can be redirected to login (optional, commented out by default)

## Configuration

The base URL is configured via environment variable:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Default: `http://localhost:3001`

## Integration with Services

Services like `authService` use the api client:

```typescript
// services/auth.ts
import api from './api'

class AuthService {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login', data)
    return response.data
  }
}
```

## Why Axios?

For a food delivery app, Axios provides:

- **Request interceptors** - Auto-attach auth tokens to all requests
- **Response interceptors** - Centralized error handling
- **Automatic JSON** - No manual `JSON.stringify()` or `.json()` calls
- **Timeout support** - Important for payment and order endpoints
- **Better error objects** - Access to response status, headers, and data

---

*Last updated: January 2026*
