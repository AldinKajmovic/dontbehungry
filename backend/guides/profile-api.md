# Profile API

This document describes the Profile API endpoints for managing user profile information.

## Overview

The Profile API allows authenticated users to:
- Update their basic profile information (name, phone, email)
- Change their password
- Update their avatar URL
- Delete their account

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

## File Structure

```
backend/src/
├── controllers/
│   ├── profile.controller.ts    # Profile HTTP request handlers
│   └── address.controller.ts    # Address HTTP request handlers
├── services/
│   ├── profile.service.ts       # Profile business logic
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
3. **Token Revocation**: Changing password revokes all refresh tokens
4. **Input Validation**: All inputs are validated before processing
5. **Input Sanitization**: Address fields are sanitized using `sanitize-html` library to prevent XSS attacks (strips all HTML tags)
6. **Role Protection**: Users cannot change their own role through these endpoints
7. **Ownership Check**: Address operations verify the address belongs to the requesting user
8. **Safe Deletion**: Place records are only deleted if no other entities reference them

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

// Update avatar
const avatarResponse = await profileService.updateAvatar({
  avatarUrl: 'https://storage.example.com/avatars/user123.jpg'
})

// Delete account
await profileService.deleteAccount()

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
```
