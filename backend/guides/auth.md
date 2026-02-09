# Authentication & Authorization Guide

## Overview

This document describes the authentication and authorization system implemented in the Glovo Clone backend.

## Architecture

The authentication system uses:
- **JWT tokens** in HttpOnly cookies (immune to XSS)
- **Refresh token rotation** for secure session management
- **Rate limiting** to prevent brute force attacks
- **Role-based access control (RBAC)** for authorization

## Token Flow

```
1. User logs in/registers
   → Server creates access token (15 min) + refresh token (7 days)
   → Both stored in HttpOnly cookies
   → Refresh token saved to database

2. Access token expires
   → Frontend receives 401
   → Frontend calls POST /api/auth/refresh
   → Server validates refresh token from cookie
   → Server rotates: invalidates old refresh token, creates new pair
   → New tokens sent in cookies

3. Refresh token reuse detected (potential theft)
   → Server revokes ALL user's refresh tokens
   → User must re-authenticate on all devices
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/api/auth/register` | Register new customer | 5/15min |
| POST | `/api/auth/register-restaurant` | Register restaurant owner | 5/15min |
| POST | `/api/auth/login` | User login | 5/15min |
| POST | `/api/auth/logout` | Logout current session | - |
| POST | `/api/auth/logout-all` | Logout all sessions | - |
| POST | `/api/auth/refresh` | Refresh access token | 5/15min |
| GET | `/api/auth/me` | Get current user | - |

### Email Verification

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| GET | `/api/auth/verify-email?token=xxx` | Verify email | - |
| POST | `/api/auth/resend-verification` | Resend verification email | 2/5min |

### Password Reset

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/api/auth/forgot-password` | Request password reset | 3/hour |
| POST | `/api/auth/reset-password` | Reset password with token | 3/hour |

## Cookie Configuration

```typescript
// Access token cookie
{
  httpOnly: true,
  secure: true, // in production
  sameSite: 'strict', // in production
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: '/'
}

// Refresh token cookie
{
  httpOnly: true,
  secure: true, // in production
  sameSite: 'strict', // in production
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth' // Only sent to auth endpoints
}
```

## Middleware Usage

### Authentication

```typescript
import { authenticate, optionalAuth } from '../middlewares/auth.middleware'

// Require authentication
router.get('/protected', authenticate, handler)

// Optional authentication (user may or may not be logged in)
router.get('/public', optionalAuth, handler)
```

### Authorization

```typescript
import {
  authorize,
  adminOnly,
  restaurantOwnerOnly,
  driverOnly,
  customerOnly,
  ownsResource
} from '../middlewares/authorize.middleware'

// Require specific roles
router.get('/admin', authenticate, adminOnly, handler)
router.get('/restaurant', authenticate, restaurantOwnerOnly, handler)

// Custom role combinations
router.get('/special', authenticate, authorize('ADMIN'), handler)

// Resource ownership check
router.get('/orders/:id', authenticate, ownsResource(async (req) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } })
  return order?.userId ?? null
}), handler)
```

### Rate Limiting

```typescript
import { authLimiter, apiLimiter, sensitiveOpLimiter } from '../middlewares/rateLimiter'

// Auth endpoints (5 requests per 15 minutes)
router.post('/login', authLimiter, handler)

// Sensitive operations (3 requests per hour)
router.post('/forgot-password', sensitiveOpLimiter, handler)

// General API (100 requests per 15 minutes)
router.get('/data', apiLimiter, handler)
```

## Database Schema

### RefreshToken

```prisma
model RefreshToken {
  id         String    @id @default(uuid())
  token      String    @unique
  userId     String
  expiresAt  DateTime
  createdAt  DateTime  @default(now())
  revokedAt  DateTime?
  replacedBy String?   // For rotation tracking

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
}
```

### VerificationToken

```prisma
model VerificationToken {
  id        String    @id @default(uuid())
  token     String    @unique
  type      TokenType
  userId    String
  expiresAt DateTime
  createdAt DateTime  @default(now())
  usedAt    DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([userId])
  @@index([type])
}

enum TokenType {
  EMAIL_VERIFICATION
  PASSWORD_RESET
}
```

### User (Auth-related fields)

```prisma
model User {
  // ... other fields
  passwordHash  String?      // Nullable for OAuth users
  emailVerified Boolean      @default(false)
  authProvider  AuthProvider @default(LOCAL)
  providerId    String?      // OAuth provider ID

  refreshTokens      RefreshToken[]
  verificationTokens VerificationToken[]
}

enum AuthProvider {
  LOCAL
  GOOGLE
}
```

## Services

### Token Service (`src/services/token.service.ts`)

```typescript
// Generate both tokens for login/register
generateTokenPair(payload: JwtPayload): Promise<{ accessToken, refreshToken }>

// Rotate refresh token (for token refresh endpoint)
rotateRefreshToken(oldToken: string, payload: JwtPayload): Promise<{ accessToken, refreshToken }>

// Revoke single refresh token
revokeRefreshToken(token: string): Promise<void>

// Revoke all user's refresh tokens (logout all devices)
revokeAllUserTokens(userId: string): Promise<void>

// Cleanup expired tokens (run periodically)
cleanExpiredTokens(): Promise<number>
```

### Verification Service (`src/services/verification.service.ts`)

```typescript
// Create verification token (invalidates existing tokens of same type)
createVerificationToken(userId: string, type: TokenType): Promise<string>

// Verify email token and update user
verifyEmailToken(token: string): Promise<string> // returns userId

// Verify password reset token (doesn't consume it)
verifyPasswordResetToken(token: string): Promise<{ userId, email }>

// Consume password reset token
consumePasswordResetToken(token: string): Promise<string> // returns userId

// Cleanup expired tokens
cleanExpiredTokens(): Promise<number>
```

### Email Service (`src/services/email.service.ts`)

```typescript
// Send verification email with token
sendVerificationEmail(email: string, firstName: string, token: string): Promise<void>

// Send password reset email with token
sendPasswordResetEmail(email: string, firstName: string, token: string): Promise<void>
```

## Environment Variables

```env
# JWT
JWT_SECRET=<64-character-random-string>

# Cookie
COOKIE_DOMAIN=localhost  # or your domain in production

# SMTP (for email verification and password reset)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email
SMTP_PASS=your-password
SMTP_FROM=noreply@glovo-clone.com

# Google OAuth (optional)
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_CALLBACK_URL=http://localhost:3001/api/oauth/google/callback
```

## Security Considerations

1. **Tokens in HttpOnly cookies** - JavaScript cannot access tokens, preventing XSS attacks
2. **SameSite=strict cookies** - Prevents CSRF attacks in production
3. **Refresh token rotation** - Limits damage from token theft
4. **Token reuse detection** - Revokes all tokens if theft suspected
5. **Token revocation on sensitive changes** - All tokens revoked when email or password is changed
6. **Rate limiting** - Prevents brute force attacks
7. **Password hashing with bcrypt** - 12 salt rounds
8. **Input validation** - All inputs validated with Zod schemas
9. **Input length limits** - Maximum string lengths enforced to prevent DoS
10. **Security headers** - Helmet middleware enabled
11. **Generic error messages** - Registration/login errors don't reveal if email exists

## Testing Checklist

- [ ] Login with valid credentials sets cookies
- [ ] Login with invalid credentials returns 401
- [ ] Protected routes return 401 without token
- [ ] Protected routes work with valid token
- [ ] Access token expiry triggers refresh
- [ ] Refresh token rotation works
- [ ] Refresh token reuse is detected and handled
- [ ] Logout clears cookies and revokes tokens
- [ ] Rate limiting blocks after threshold
- [ ] Role-based access enforced correctly
- [ ] Email verification flow works end-to-end
- [ ] Password reset flow works end-to-end
