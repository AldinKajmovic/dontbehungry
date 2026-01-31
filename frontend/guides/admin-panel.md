# Admin Panel Documentation

## Overview

The Admin Panel provides a web interface for managing all entities in the system. It's accessible at `/panel` and restricted to users with `ADMIN` or `SUPER_ADMIN` roles.

## Access Requirements

1. User must be authenticated
2. User must have `ADMIN` or `SUPER_ADMIN` role
3. User's IP must be in the whitelist (if configured)

## Features

### Dashboard (`/panel`)

The main dashboard displays:
- **Statistics Cards**: Total users, restaurants, orders, and revenue
- **Quick Actions**: Shortcuts to common tasks

### Users Management (`/panel/users`)

Manage user accounts with full CRUD operations:
- Create new users with password
- Update user details and roles
- Delete users (with confirmation)
- Search by email or name
- Filter by role (Customer, Restaurant Owner, Delivery Driver, Admin)
- Filter by verification status (Verified, Pending)
- Pagination with configurable page size (5, 10, 25, 100)

**Available Roles:**
- `CUSTOMER` - Regular customers
- `RESTAURANT_OWNER` - Restaurant managers
- `DELIVERY_DRIVER` - Delivery personnel
- `ADMIN` - Administrator access

### Restaurants Management (`/panel/restaurants`)

Manage restaurant listings:
- Create restaurants with owner and place selection via searchable dropdowns
- Update restaurant details, fees, owner, and place
- Delete restaurants (cascades to menu items, orders, reviews)
- Search by name or email

**Create/Edit Form Fields:**
- Restaurant Name
- Description (optional)
- Phone (optional)
- Email (optional)
- Owner (searchable dropdown - searches users by name)
- Place (searchable dropdown - searches places by address)
- Min Order Amount (optional)
- Delivery Fee (optional)
- **Gallery Section** - Up to 6 images for interior, exterior, food photos
  - Images displayed in 3-column grid
  - Delete on hover (trash icon overlay)
  - Plus button to add new images
  - First image used as logo, second as cover

### Categories Management (`/panel/categories`)

Manage food categories:
- Create categories with optional icon URL
- Update category names and descriptions
- Delete categories (menu items will have null category)
- Search by name

### Menu Items Management (`/panel/menu-items`)

Manage restaurant menus:
- Create items with restaurant and category selection via searchable dropdowns
- Update item details and toggle availability
- Delete items
- Search by name
- Filter by availability (Available, Unavailable)

**Create Form Fields:**
- Restaurant (required - searchable dropdown)
- Category (optional - searchable dropdown)

### Orders Management (`/panel/orders`)

Manage customer orders:
- **Create orders** manually via modal form
- View order details and status
- Update order status and assign drivers via searchable dropdown
- Delete orders
- Search by order ID or customer email
- Filter by order status (Pending, Confirmed, Preparing, Ready, Delivered, Cancelled)
- Filter by payment status (Pending, Completed, Failed, Refunded)
- Filter by total amount range
- Filter by created date range (from/to date pickers)
- Sort by status, total amount, or created date (ascending/descending)

**Create Form Fields:**
- Customer (searchable dropdown - required)
- Restaurant (searchable dropdown - required)
- Delivery Address (searchable dropdown - required)
- Driver (searchable dropdown - optional, defaults to "Unassigned")
- Status (dropdown - defaults to "PENDING")
- Subtotal (currency input - required)
- Delivery Fee (currency input - optional)
- Tax (currency input - optional)
- Notes (textarea - optional)

**Edit Form Fields:**
- Status (dropdown with order statuses)
- Driver (searchable dropdown with clear button to unassign)
- Notes (optional)

**Driver Selection:**
- Defaults to "Unassigned" when no driver selected
- Use the "x" clear button inside the dropdown to unassign a driver
- Placeholder shows "Unassigned" when empty

**Order Statuses:**
- `PENDING` - Waiting for confirmation
- `CONFIRMED` - Accepted by restaurant
- `PREPARING` - Being prepared
- `READY_FOR_PICKUP` - Ready for driver
- `OUT_FOR_DELIVERY` - On the way
- `DELIVERED` - Completed
- `CANCELLED` - Cancelled

### Reviews Management (`/panel/reviews`)

Manage customer reviews:
- Create reviews with user and restaurant selection via searchable dropdowns
- Update ratings and content
- Delete inappropriate reviews
- Search by title or content
- Filter by rating (1-5 stars)

**Create Form Fields:**
- User (searchable dropdown - searches users by name)
- Restaurant (searchable dropdown - searches restaurants by name)

### Places Management (`/panel/places`)

Manage delivery locations:
- Create new places/addresses
- Update address details
- Delete places
- Search by address, city, or country

## Components

### Reusable Components

Located in `frontend/components/admin/`:

#### `AdminSidebar.tsx`
Navigation sidebar with:
- Links to all admin pages
- "Back to Site" link (routes to `/my-profile`)
- **Logout button** (red, at bottom of sidebar)

#### `DataTable.tsx`
Generic table component with:
- Column definitions with custom render functions
- Loading state
- Empty state message
- Row actions
- Optional row click handler

**Usage:**
```tsx
<DataTable
  columns={[
    { key: 'email', header: 'Email', render: (user) => <span>{user.email}</span> }
  ]}
  data={users}
  keyField="id"
  isLoading={loading}
  actions={(user) => <Button onClick={() => edit(user)}>Edit</Button>}
/>
```

#### `Pagination.tsx`
Pagination controls with:
- Page navigation (first, prev, next, last)
- Page numbers with ellipsis
- Items per page dropdown (5, 10, 25, 100)
- Showing X to Y of Z results

**Usage:**
```tsx
<Pagination
  page={1}
  totalPages={10}
  limit={10}
  total={95}
  onPageChange={(page) => setPage(page)}
  onLimitChange={(limit) => setLimit(limit)}
/>
```

#### `DeleteConfirmModal.tsx`
Confirmation modal for delete actions.

**Usage:**
```tsx
<DeleteConfirmModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onConfirm={handleDelete}
  title="Delete User"
  message="Are you sure?"
  isLoading={deleting}
/>
```

#### `StatsCard.tsx`
Dashboard statistics display card.

**Usage:**
```tsx
<StatsCard
  title="Total Users"
  value={1234}
  icon={<UsersIcon />}
  trend={{ value: 12, isPositive: true }}
/>
```

#### `FilterBar.tsx`
Generic filter bar component for list pages.

**Usage:**
```tsx
const FILTER_CONFIG = [
  {
    key: 'role',
    label: 'Role',
    options: [
      { value: 'ADMIN', label: 'Admin' },
      { value: 'CUSTOMER', label: 'Customer' }
    ],
    placeholder: 'All Roles'
  }
]

<FilterBar
  filters={FILTER_CONFIG}
  values={filters}
  onChange={(key, value) => setFilters({ ...filters, [key]: value })}
  onClear={() => setFilters({})}
/>
```

**Features:**
- Configurable filter options via `filters` prop
- Automatic "All" option added to each dropdown
- "Clear filters" button appears when filters are active
- Styled with gray background to visually separate from search

### UI Components

#### `Select.tsx`

Static dropdown component for predefined options:

```tsx
<Select
  label="Role"
  options={[
    { value: 'ADMIN', label: 'Admin' },
    { value: 'CUSTOMER', label: 'Customer' }
  ]}
  value={role}
  onChange={(e) => setRole(e.target.value)}
/>
```

#### `SearchableSelect.tsx`

Dynamic searchable dropdown with lazy loading for large datasets:

```tsx
<SearchableSelect
  label="User"
  id="userId"
  value={selectedUserId}
  onChange={(value) => setSelectedUserId(value)}
  loadOptions={(search) => adminService.getUsersForSelect(search)}
  placeholder="Search users..."
  emptyMessage="No users found"
  required
/>
```

**Features:**
- Debounced search (300ms) to reduce API calls
- Loads 25 items per search to avoid performance issues
- Shows loading state while fetching
- Displays custom empty message when no results
- Click outside to close
- Clear button to reset selection

## Services

### Admin Service Structure

The admin service is organized in a modular structure:

```
services/admin/
├── types.ts     # All admin types (AdminUser, AdminRestaurant, etc.)
├── service.ts   # AdminService class with CRUD methods
└── index.ts     # Re-exports
```

### Usage

```typescript
import { adminService } from '@/services/admin'
import type { AdminUser, PaginatedResponse } from '@/services/admin'

// Verify access
await adminService.verifyAccess()

// Get stats
const stats = await adminService.getStats()

// CRUD operations (same pattern for all entities)
const users = await adminService.getUsers(page, limit, search)
const user = await adminService.getUserById(id)
const newUser = await adminService.createUser(data)
const updated = await adminService.updateUser(id, data)
await adminService.deleteUser(id)

// Select helpers for SearchableSelect dropdowns
const userOptions = await adminService.getUsersForSelect(search)
const driverOptions = await adminService.getDriversForSelect(search)
const restaurantOptions = await adminService.getRestaurantsForSelect(search)
const categoryOptions = await adminService.getCategoriesForSelect(search)
const placeOptions = await adminService.getPlacesForSelect(search)
```

### Available CRUD Methods

| Entity | Methods |
|--------|---------|
| Users | `getUsers`, `getUserById`, `createUser`, `updateUser`, `deleteUser` |
| Restaurants | `getRestaurants`, `getRestaurantById`, `createRestaurant`, `updateRestaurant`, `deleteRestaurant` |
| Categories | `getCategories`, `getCategoryById`, `createCategory`, `updateCategory`, `deleteCategory` |
| Menu Items | `getMenuItems`, `getMenuItemById`, `createMenuItem`, `updateMenuItem`, `deleteMenuItem` |
| Orders | `getOrders`, `getOrderById`, `updateOrder`, `deleteOrder` |
| Reviews | `getReviews`, `getReviewById`, `createReview`, `updateReview`, `deleteReview` |
| Places | `getPlaces`, `getPlaceById`, `createPlace`, `updatePlace`, `deletePlace` |
| Payments | `getPayments`, `getPaymentById`, `updatePayment` |

## Hooks

### `useAdminAuth` (`frontend/hooks/useAdminAuth.ts`)

Hook for admin authentication:

```typescript
const { isAuthorized, isLoading, error, checkAccess } = useAdminAuth()
```

Features:
- Automatic redirect for unauthorized users
- IP whitelist verification via API
- Loading and error states

## Layout

### Admin Layout (`frontend/app/panel/layout.tsx`)

Wraps all admin pages with:
- Authentication check
- Authorization verification
- Sidebar navigation
- Loading state while verifying access
- Error state for unauthorized access

## Navigation

### Sidebar Links
- Dashboard
- Users
- Restaurants
- Categories
- Menu Items
- Orders
- Reviews
- Places

### Bottom Actions
- **Back to Site**: Routes to `/my-profile`
- **Log out**: Logs user out and redirects to login page

## My Profile Integration

A "Go to Admin Panel" button appears in the my-profile page for admin users, located after the "Account Information" section.

## Files Structure

```
frontend/
├── app/
│   ├── not-found.tsx          # 404 page
│   ├── my-profile/
│   │   └── page.tsx           # Updated with admin link
│   └── panel/
│       ├── layout.tsx         # Admin layout
│       ├── page.tsx           # Dashboard
│       ├── users/page.tsx
│       ├── restaurants/page.tsx
│       ├── categories/page.tsx
│       ├── menu-items/page.tsx
│       ├── orders/page.tsx
│       ├── reviews/page.tsx
│       └── places/page.tsx
├── components/
│   ├── admin/
│   │   ├── AdminSidebar.tsx
│   │   ├── DataTable.tsx
│   │   ├── FilterBar.tsx
│   │   ├── Pagination.tsx
│   │   ├── DeleteConfirmModal.tsx
│   │   └── StatsCard.tsx
│   └── ui/
│       ├── Select.tsx
│       └── SearchableSelect.tsx
├── hooks/
│   └── useAdminAuth.ts
└── services/
    └── admin/
        ├── types.ts
        ├── service.ts
        └── index.ts
```

## Styling

The admin panel uses existing Tailwind CSS classes and follows the design patterns established in the codebase:
- Primary color for actions and highlights
- Rounded corners (xl/lg/md)
- Shadow-sm for elevation
- Gray-50 background
- White cards with gray-100 borders
- Red color for logout/danger actions

---

*Last updated: January 2026*
