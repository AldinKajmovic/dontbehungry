# API Client (Axios)

## Overview

The frontend uses Axios for HTTP requests to the backend API. The client is configured with interceptors for authentication, automatic token refresh, and error handling.

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

## Features

### Automatic Cookie Credentials

The client automatically sends HttpOnly cookies with all requests:

```typescript
// Credentials are sent automatically - no manual token handling
await api.get('/api/auth/me')
// Cookies sent automatically with request
```

### Automatic Token Refresh

The response interceptor handles 401 errors by:
1. Attempting to refresh the access token via `/api/auth/refresh`
2. Retrying the original request with new tokens
3. Queuing concurrent requests while refresh is in progress
4. Dispatching `auth:logout` event if refresh fails

```typescript
// If your access token expires during a request:
// 1. API returns 401
// 2. Interceptor calls /api/auth/refresh
// 3. New tokens are set in cookies
// 4. Original request is retried automatically
await api.get('/api/orders')
```

### Error Handling

The response interceptor extracts user-friendly error messages:

```typescript
try {
  await api.post('/api/orders', data)
} catch (error) {
  // error.message contains the user-friendly API error message
  // e.g., "Email already exists" instead of "Request failed with status 409"
  console.error(error.message)
}
```

### Logout Event

When token refresh fails (session expired), the client dispatches a custom event:

```typescript
// AuthProvider listens for this event
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

## Integration with Services

Services use the api client for all HTTP requests:

```typescript
// services/auth.ts
import api from './api'

class AuthService {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login', data)
    return response.data
  }
}

// services/profile.ts
import api from './api'

export const profileService = {
  async updateProfile(data: UpdateProfileData) {
    const response = await api.patch('/api/profile', data)
    return response.data
  }
}

// services/address.ts
import api from './api'

export const addressService = {
  async getAddresses() {
    const response = await api.get('/api/addresses')
    return response.data
  }
}
```

## Available Services

| Service | File | Purpose |
|---------|------|---------|
| `authService` | `services/auth.ts` | Authentication (login, register, logout) |
| `profileService` | `services/profile.ts` | Profile management (update, password, avatar) |
| `addressService` | `services/address.ts` | Address CRUD operations |

## Why Axios?

For a food delivery app, Axios provides:

- **Request interceptors** - Configure credentials for all requests
- **Response interceptors** - Automatic token refresh & centralized error handling
- **Automatic JSON** - No manual `JSON.stringify()` or `.json()` calls
- **Timeout support** - Important for payment and order endpoints
- **Better error objects** - Access to response status, headers, and data
- **Request queuing** - Queue requests during token refresh

## Security Notes

- Tokens are stored in HttpOnly cookies (not accessible via JavaScript)
- Credentials are sent automatically with `withCredentials: true`
- Token refresh is handled server-side via cookies
- No sensitive data stored in localStorage

---

*Last updated: January 2026*
