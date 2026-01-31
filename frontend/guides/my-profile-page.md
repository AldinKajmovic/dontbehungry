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

**My Restaurants Section**

Restaurant owners can manage multiple restaurants from their profile:

- **Restaurant Cards Grid**: Similar to the addresses section, displays all owned restaurants in a card grid
- **Add Restaurant**: Button to create a new restaurant via modal
- **Restaurant Card Details**:
  - Restaurant name
  - Location (city, country)
  - Rating (if available)
  - Logo thumbnail (if set)
- **Card Actions**:
  - Click card or "Edit" to open edit modal
  - "Delete" to remove restaurant (with confirmation)

**Restaurant Modal (Create/Edit)**

Modal form for creating or editing restaurants:

- **Basic Info**:
  - Restaurant name (required)
  - Description (optional)
  - Phone (optional)
  - Email (optional)

- **Location** (create only - cannot edit location):
  - Street address (required)
  - City (required)
  - Country (required)
  - Postal code (optional)

- **Delivery Settings** (aligned in a 2-column grid):
  - Minimum order amount (optional)
  - Delivery fee (optional)

- **Gallery Section**:
  - Displays up to 6 images for the restaurant
  - Images shown in a 3-column grid
  - Each image has a delete button (trash icon) on hover
  - Plus button to add new images (placeholder for future upload)
  - Counter shows current/max images (e.g., "3/6")
  - First image used as logo, second as cover

**Menu Items Management**

Restaurant owners can manage menu items directly from their profile:

- **Menu Items Section**: Appears when clicking on a restaurant card
- **Pagination**: Configurable items per page (5, 10, 20, 50)
- **Search**: Filter menu items by name or description
- **Add Menu Item**: Button to create a new menu item via modal
- **Menu Item Card Details**:
  - Item name and description
  - Price
  - Availability status (badge)
  - Category (if set)
  - Image thumbnail (if set)
- **Card Actions**:
  - Click "Edit" to open edit modal
  - Click "Delete" with confirmation modal

**Menu Item Modal (Create/Edit)**

Modal form for creating or editing menu items:

- **Basic Info**:
  - Item name (required)
  - Description (optional)
  - Price (required)
  - Preparation time (optional, in minutes)

- **Settings**:
  - Category (searchable dropdown)
  - Availability toggle

- **Image**:
  - Image URL input or upload button (placeholder for future)

### Admin Users Only

**Administration Section**
- Link to admin panel (`/panel`)
- "Go to Admin Panel" button

## File Structure

```
frontend/
├── app/my-profile/page.tsx      # Main profile page component
├── services/
│   ├── profile/
│   │   ├── types.ts             # Profile & restaurant types
│   │   ├── service.ts           # Profile API service
│   │   └── index.ts
│   └── address/
│       ├── types.ts             # Address types
│       ├── service.ts           # Address API service
│       └── index.ts
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
- `Modal` - Address, restaurant, and menu item modals
- `Section` - Page section wrapper with title and optional header action
- `EmailVerificationBanner` - Dismissible banner for unverified users
- Delete confirmation modals (custom Modal with warning styling)

## State Management

The page uses React's `useState` for local form state and the `AuthContext` for user data:

```typescript
const { user, isLoading, updateUser, logout } = useAuth()

// Restaurant state (for restaurant owners)
const [restaurants, setRestaurants] = useState<MyRestaurant[]>([])
const [restaurantsLoading, setRestaurantsLoading] = useState(true)
const [showRestaurantModal, setShowRestaurantModal] = useState(false)
const [editingRestaurant, setEditingRestaurant] = useState<MyRestaurant | null>(null)

// Menu items state
const [menuItems, setMenuItems] = useState<MenuItem[]>([])
const [menuItemsPage, setMenuItemsPage] = useState(1)
const [menuItemsPerPage, setMenuItemsPerPage] = useState(5)
const [menuItemsSearch, setMenuItemsSearch] = useState('')

// Restaurant form state (includes gallery)
const [restaurantForm, setRestaurantForm] = useState({
  name: '',
  description: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  country: '',
  postalCode: '',
  minOrderAmount: '',
  deliveryFee: '',
  images: [] as string[],  // Gallery images array
})
```

When profile updates succeed, `updateUser()` is called to sync the auth context.

## Email Change Flow

When a user changes their email:
1. API call to `PATCH /api/profile` with new email
2. Backend sets `emailVerified = false` and sends verification email
3. Response includes `emailChanged: true`
4. Frontend shows success message prompting user to verify new email
5. `EmailVerificationBanner` appears until email is verified

## Restaurant Management Flow

### Loading Restaurants

```typescript
useEffect(() => {
  if (user?.role === 'RESTAURANT_OWNER') {
    loadRestaurants()
  }
}, [user])

const loadRestaurants = async () => {
  const { restaurants } = await profileService.getMyRestaurants()
  setRestaurants(restaurants)
}
```

### Creating a Restaurant

1. User clicks "Add Restaurant" button
2. Modal opens with empty form (location fields visible)
3. User fills in required fields (name, address, city, country)
4. On submit: `profileService.createMyRestaurant(data)`
5. Modal closes, restaurants list refreshes

### Editing a Restaurant

1. User clicks restaurant card or "Edit" button
2. Modal opens with pre-filled form (location fields hidden)
3. User modifies fields
4. On submit: `profileService.updateMyRestaurant(id, data)`
5. Modal closes, restaurants list refreshes

### Deleting a Restaurant

1. User clicks "Delete" on a restaurant card
2. Confirmation modal appears with warning message
3. On confirm: `profileService.deleteMyRestaurant(id)`
4. Restaurant removed from state instantly (no refetch needed)

### Menu Items Management Flow

#### Loading Menu Items

```typescript
const loadMenuItems = async (restaurantId: string) => {
  const items = await profileService.getMenuItems(restaurantId)
  setMenuItems(items)
}
```

#### Filtering and Pagination

```typescript
// Filter by search term
const filteredMenuItems = menuItems.filter(item =>
  item.name.toLowerCase().includes(menuItemsSearch.toLowerCase()) ||
  item.description?.toLowerCase().includes(menuItemsSearch.toLowerCase())
)

// Paginate results
const paginatedMenuItems = filteredMenuItems.slice(
  (menuItemsPage - 1) * menuItemsPerPage,
  menuItemsPage * menuItemsPerPage
)
```

#### Creating a Menu Item

1. User clicks "Add Menu Item" button
2. Modal opens with empty form
3. User fills in required fields (name, price)
4. On submit: `profileService.createMenuItem(restaurantId, data)`
5. Modal closes, new item added to state instantly

#### Editing a Menu Item

1. User clicks "Edit" on a menu item card
2. Modal opens with pre-filled form
3. User modifies fields
4. On submit: `profileService.updateMenuItem(itemId, data)`
5. Modal closes, item updated in state instantly

#### Deleting a Menu Item

1. User clicks "Delete" on a menu item card
2. Confirmation modal appears
3. On confirm: `profileService.deleteMenuItem(itemId)`
4. Item removed from state, pagination adjusts if needed

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
const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

// Restaurant section only shown for restaurant owners
{isRestaurantOwner && (
  <Section title="My Restaurants">...</Section>
)}

// Admin section only shown for admins
{isAdmin && (
  <Section title="Administration">...</Section>
)}

// Password section hidden for Google OAuth users
{!isGoogleUser && (
  <Section title="Change Password">...</Section>
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
| Get my restaurants | `/api/profile/my-restaurants` | GET |
| Create restaurant | `/api/profile/my-restaurants` | POST |
| Update restaurant | `/api/profile/my-restaurants/:id` | PATCH |
| Delete restaurant | `/api/profile/my-restaurants/:id` | DELETE |
| Get menu items | `/api/profile/my-restaurants/:id/menu-items` | GET |
| Create menu item | `/api/profile/my-restaurants/:id/menu-items` | POST |
| Update menu item | `/api/profile/my-restaurants/:id/menu-items/:itemId` | PATCH |
| Delete menu item | `/api/profile/my-restaurants/:id/menu-items/:itemId` | DELETE |

## Styling

The page uses Tailwind CSS classes following the project's design system:
- `bg-white rounded-xl shadow-sm p-6` for sections
- `btn-primary` and `btn-secondary` for buttons
- `input-field` for form inputs
- Responsive grid layouts (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`)
- Modal with backdrop overlay
- Card hover effects with border transitions

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

---

*Last updated: January 2026*
