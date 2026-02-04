# Frontend Authentication Guide

## Overview

This document describes the authentication system implementation in the Glovo Clone frontend.

## Architecture

The authentication system uses:
- **HttpOnly cookies** for token storage (managed by backend)
- **AuthProvider** React context for global auth state
- **useAuth hook** for accessing auth functionality
- **Next.js middleware** for route protection
- **Automatic token refresh** on 401 responses

## Components

### AuthProvider (`providers/AuthProvider.tsx`)

The `AuthProvider` wraps your application and provides authentication state and methods.

```tsx
// app/layout.tsx
import { AuthProvider } from '@/providers/AuthProvider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
```

### useAuth Hook (`hooks/useAuth.ts`)

Access authentication state and methods from any component.

```tsx
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const {
    user,           // Current user object or null
    isLoading,      // True while checking auth status
    isAuthenticated, // True if user is logged in
    login,          // Login function
    register,       // Register customer function
    registerRestaurant, // Register restaurant function
    logout,         // Logout current session
    logoutAll,      // Logout all sessions
    refreshUser,    // Refresh user data
    resendVerification, // Resend email verification
  } = useAuth()

  if (isLoading) return <div>Loading...</div>

  if (!isAuthenticated) {
    return <div>Please log in</div>
  }

  return <div>Hello, {user.firstName}!</div>
}
```

## Authentication Flow

### Login

```tsx
const { login } = useAuth()

const handleLogin = async (data: { email: string; password: string }) => {
  try {
    await login(data)
    // User is redirected to restaurants page (/restaurants)
    // Unverified users see EmailVerificationBanner on protected pages
  } catch (error) {
    // Handle error (show message to user)
  }
}
```

### Register

```tsx
const { register } = useAuth()

const handleRegister = async (data) => {
  try {
    await register({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      phone: '+1234567890', // required
      address: '123 Main St', // optional
      city: 'New York',       // optional (required if address is set)
      country: 'USA',         // optional (required if address is set)
    })
    // Redirects to verification-sent page, then to restaurants page after verification
  } catch (error) {
    // Handle error
  }
}
```

### Logout

```tsx
const { logout, logoutAll } = useAuth()

// Logout current session
await logout()

// Logout all sessions (all devices)
await logoutAll()
```

## Route Protection

### Next.js Proxy (`proxy.ts`)

The proxy automatically protects routes based on authentication status. (Note: In Next.js 16, `middleware.ts` was renamed to `proxy.ts` to clarify its role at the network boundary.)

**Protected Routes** (require authentication):
- `/orders`
- `/dashboard`
- `/profile`
- `/settings`

**Public Routes with Auth-Aware Features**:
- `/restaurants` - Public, but "add to cart" button only visible when logged in

**Auth Routes** (redirect to home if authenticated):
- `/auth/login`
- `/auth/register`
- `/auth/register-restaurant`

**Public Routes**:
- `/`
- `/auth/verify-email`
- `/auth/verification-sent`
- `/auth/forgot-password`
- `/auth/reset-password`

### Protecting Custom Routes

Add routes to the arrays in `proxy.ts`:

```typescript
const PROTECTED_ROUTES = [
  '/dashboard',
  '/orders',
  '/profile',
  '/my-profile',
  '/settings',
  '/my-new-route', // Add your route
]
```

## API Service (`services/api.ts`)

The API service automatically:
1. Includes credentials (cookies) with all requests
2. Handles 401 responses by attempting token refresh
3. Dispatches `auth:logout` event if refresh fails

```typescript
import api from '@/services/api'

// All requests automatically include cookies
const response = await api.get('/api/some-endpoint')
const data = await api.post('/api/some-endpoint', { foo: 'bar' })
```

## Auth Service (`services/auth.ts`)

Lower-level auth methods (used by AuthProvider):

```typescript
import { authService } from '@/services/auth'

// Login
await authService.login({ email, password })

// Register
await authService.register({ firstName, lastName, email, password, phone })

// Register restaurant
await authService.registerRestaurant({
  ...userData,
  restaurantName: 'My Restaurant',
  restaurantDescription: 'Optional description',
  restaurantPhone: '+1234567890',
  restaurantEmail: 'contact@restaurant.com',
  address: '123 Main St',
  city: 'New York',
  country: 'USA',
  postalCode: '10001',
  minOrderAmount: 15.00, // optional
  deliveryFee: 2.50,     // optional
})

// Logout
await authService.logout()

// Logout all devices
await authService.logoutAll()

// Get current user
const { user } = await authService.getCurrentUser()

// Verify email
await authService.verifyEmail(token)

// Resend verification
await authService.resendVerification()

// Forgot password
await authService.forgotPassword(email)

// Reset password
await authService.resetPassword(token, newPassword)
```

## Pages

### Email Verification

**Verification Sent** (`/auth/verification-sent`)
- Shown after registration
- Displays email sent message
- "Resend" button to request new email
- "Sign Out" button to logout

**Verify Email** (`/auth/verify-email?token=xxx`)
- Processes email verification token
- Shows success/error state
- Redirects to home on success

### Password Reset

**Forgot Password** (`/auth/forgot-password`)
- Email input form
- Sends password reset email
- Shows confirmation message

**Reset Password** (`/auth/reset-password?token=xxx`)
- New password form with confirmation
- Password strength indicator
- Shows success/error state
- Redirects to login on success

## User Object

```typescript
interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: 'CUSTOMER' | 'RESTAURANT_OWNER' | 'DELIVERY_DRIVER' | 'ADMIN' | 'SUPER_ADMIN'
  emailVerified: boolean
  phoneVerified: boolean
  avatarUrl?: string
}
```

## Event Handling

The AuthProvider listens for the `auth:logout` custom event, which is dispatched by the API service when token refresh fails.

```typescript
// This is handled automatically by AuthProvider
window.addEventListener('auth:logout', () => {
  // Clear user state and redirect to login
})
```

## Examples

### Protected Component

```tsx
'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div>
      <h1>Welcome, {user.firstName}!</h1>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
      <p>Email verified: {user.emailVerified ? 'Yes' : 'No'}</p>
    </div>
  )
}
```

### Conditional Rendering

```tsx
'use client'

import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

export function NavBar() {
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <nav>
      {isAuthenticated ? (
        <>
          <span>Hello, {user.firstName}</span>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <>
          <Link href="/auth/login">Login</Link>
          <Link href="/auth/register">Register</Link>
        </>
      )}
    </nav>
  )
}
```

## Profile Service (`services/profile.ts`)

Manage user profile and restaurant settings:

```typescript
import { profileService } from '@/services/profile'

// Update user profile
await profileService.updateProfile({
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1234567890',
  email: 'john@example.com',
})

// Change password
await profileService.changePassword({
  currentPassword: 'old-password',
  newPassword: 'new-password',
})

// Delete account
await profileService.deleteAccount()

// Get restaurant (for restaurant owners)
const { restaurant } = await profileService.getMyRestaurant()

// Update restaurant settings (for restaurant owners)
await profileService.updateMyRestaurant({
  name: 'Updated Restaurant Name',
  description: 'New description',
  phone: '+1234567890',
  email: 'contact@restaurant.com',
  minOrderAmount: 20.00,
  deliveryFee: 3.00,
})
```

### Restaurant Settings in My Profile

Restaurant owners see an additional "Restaurant Settings" section in the my-profile page where they can:
- Update restaurant name and description
- Update restaurant contact information
- Set minimum order amount
- Set delivery fee

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Troubleshooting

### Cookies not being sent

1. Ensure `credentials: 'include'` is set (handled by api.ts)
2. Check CORS configuration on backend allows credentials
3. Verify cookie domain matches frontend domain
4. In development, ensure both frontend and backend are on localhost

### Infinite refresh loop

The API service prevents infinite loops by:
1. Not retrying auth endpoints
2. Tracking refresh state with `isRefreshing` flag
3. Queuing requests while refresh is in progress

### Token refresh failing silently

Check browser console for `auth:logout` event being dispatched. If the refresh fails, the user should be redirected to login.
