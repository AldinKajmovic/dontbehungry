# My Profile Page

This document describes the My Profile page implementation and its features.

## Overview

The My Profile page (`/my-profile`) allows authenticated users to manage their account settings. The page displays different sections based on the user's role.

## Features

### All Users

1. **Profile Picture Section**
   - Displays current avatar or initials placeholder
   - Upload/remove buttons (currently disabled - placeholder for future cloud storage integration)

2. **Basic Information**
   - Edit first name and last name
   - Edit email address (triggers re-verification)
   - Edit phone number (optional)
   - Shows email verification status

3. **My Addresses**
   - Gallery view of saved delivery addresses
   - Add new address via modal form
   - Edit existing addresses
   - Set default address
   - Delete addresses
   - Shows address details with notes

4. **Change Password** (hidden for Google OAuth users)
   - Current password required
   - New password confirmation
   - Minimum 8 characters

5. **Account Information**
   - Role (read-only)
   - Email verification status
   - Phone verification status

6. **Danger Zone**
   - Delete account with two-step confirmation modal
   - First modal: "Are you sure?" warning
   - Second modal: Final confirmation before deletion

7. **Header Actions**
   - Back button to home page
   - Role badge display
   - Logout button

### Restaurant Owners Only

**Restaurant Photos Section**
- Grid of photo placeholders (gray boxes)
- Add new photo button
- Remove photo button on hover
- Placeholder for future AWS/Google Cloud Storage integration

## File Structure

```
frontend/
├── app/my-profile/page.tsx      # Main profile page component
├── services/
│   ├── profile.ts               # Profile API service
│   └── address.ts               # Address API service
├── providers/AuthProvider.tsx   # Auth context with updateUser
├── components/ui/
│   └── EmailVerificationBanner.tsx  # Dismissible verification banner
└── proxy.ts                     # Route protection (Next.js 16+)
```

## Route Protection

The `/my-profile` route is protected by the Next.js proxy (`proxy.ts`). Unauthenticated users are redirected to `/auth/login`.

## Components Used

- `Input` - Form inputs with labels and validation
- `Button` - Primary and secondary action buttons
- `Alert` - Success and error messages
- `EmailVerificationBanner` - Dismissible banner for unverified users

## State Management

The page uses React's `useState` for local form state and the `AuthContext` for user data:

```typescript
const { user, isLoading, updateUser, logout } = useAuth()
```

When profile updates succeed, `updateUser()` is called to sync the auth context.

## Email Change Flow

When a user changes their email:
1. API call to `PATCH /api/profile` with new email
2. Backend sets `emailVerified = false` and sends verification email
3. Response includes `emailChanged: true`
4. Frontend shows success message prompting user to verify new email
5. `EmailVerificationBanner` appears until email is verified

## Address Management

### Address Modal
- Opens for both add and edit operations
- Form fields: address, city, state, country, postal code, notes
- Required fields: address, city, country
- Validates before submission

### Address Cards
- Display address info in a gallery grid
- Default address highlighted with badge
- Actions: Edit, Set as default, Delete

## Delete Account Flow

1. User clicks "Delete Account" button
2. First confirmation modal appears with warning
3. User clicks "Yes, delete my account"
4. Second confirmation modal appears
5. User clicks "I understand, delete my account"
6. API call to `DELETE /api/profile`
7. User is logged out and redirected to login page

## Role-Based Visibility

```typescript
const isRestaurantOwner = user?.role === 'RESTAURANT_OWNER'
const isGoogleUser = !user?.phone && user?.avatarUrl?.includes('google')

// Restaurant photos section only shown for restaurant owners
{isRestaurantOwner && (
  <section>Restaurant Photos...</section>
)}

// Password section hidden for Google OAuth users
{!isGoogleUser && (
  <section>Change Password...</section>
)}
```

## API Endpoints Used

| Action | Endpoint | Method |
|--------|----------|--------|
| Update profile | `/api/profile` | PATCH |
| Change password | `/api/profile/change-password` | POST |
| Update avatar | `/api/profile/avatar` | PATCH |
| Delete account | `/api/profile` | DELETE |
| Get addresses | `/api/addresses` | GET |
| Add address | `/api/addresses` | POST |
| Update address | `/api/addresses/:id` | PATCH |
| Delete address | `/api/addresses/:id` | DELETE |
| Set default | `/api/addresses/:id/default` | POST |

## Future Enhancements

### Profile Picture Upload
The profile picture section is currently a placeholder. To implement:
1. Add file upload component
2. Integrate with AWS S3 or Google Cloud Storage
3. Call `profileService.updateAvatar()` with the uploaded URL

### Restaurant Photos
The restaurant photos section shows placeholders. To implement:
1. Create a RestaurantImage model/table if needed
2. Add API endpoints for restaurant image management
3. Integrate with cloud storage for image uploads
4. Update the placeholder grid to use real images

## Styling

The page uses Tailwind CSS classes following the project's design system:
- `bg-white rounded-xl shadow-sm p-6` for sections
- `btn-primary` and `btn-secondary` for buttons
- `input-field` for form inputs
- Responsive grid layouts (`grid-cols-1 sm:grid-cols-2`)
- Modal with backdrop overlay

## Example Usage

Navigate to the profile page:
```
/my-profile
```

Or link from other pages:
```tsx
import Link from 'next/link'

<Link href="/my-profile">Edit Profile</Link>
```
