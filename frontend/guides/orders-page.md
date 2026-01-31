# Orders Page Guide

This guide documents the order history page at `/orders`.

## Overview

The orders page is a dedicated route for viewing order history with advanced filtering options. It replaces the inline order history in the profile page for a cleaner user experience.

## Features

- **Status Filter**: Filter orders by status (Pending, Confirmed, Preparing, etc.)
- **Date Range Filter**: Filter orders by date range (from/to)
- **Pagination**: Navigate through order history with scroll-to-top on page change
- **Back Button**: Quick navigation back to profile page

## Route

```
/orders
```

## Authentication

The page requires authentication. Unauthenticated users are redirected to `/auth/login`.

## Components

### Status Filter

Dropdown select with all order statuses:

| Value | Label |
|-------|-------|
| (empty) | All Statuses |
| PENDING | Pending |
| CONFIRMED | Confirmed |
| PREPARING | Preparing |
| READY_FOR_PICKUP | Ready for Pickup |
| OUT_FOR_DELIVERY | Out for Delivery |
| DELIVERED | Delivered |
| CANCELLED | Cancelled |

### Status Colors

Each status has a distinct color:

```typescript
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'PENDING': return 'bg-yellow-100 text-yellow-800'
    case 'CONFIRMED': return 'bg-blue-100 text-blue-800'
    case 'PREPARING': return 'bg-purple-100 text-purple-800'
    case 'READY_FOR_PICKUP': return 'bg-indigo-100 text-indigo-800'
    case 'OUT_FOR_DELIVERY': return 'bg-orange-100 text-orange-800'
    case 'DELIVERED': return 'bg-green-100 text-green-800'
    case 'CANCELLED': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}
```

## API Integration

The page uses the profile service to fetch orders:

```typescript
const result = await profileService.getMyOrderHistory({
  page: pageNum,
  limit: 10,
  status: statusFilter || undefined,
  createdAtFrom: fromDate || undefined,
  createdAtTo: toDate || undefined,
})
```

### Backend Endpoint

```
GET /api/profile/my-orders
```

Query Parameters:
- `status` - Filter by order status
- `createdAtFrom` - Filter orders created after this date
- `createdAtTo` - Filter orders created before this date
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

## Navigation

### From Profile Page

The profile page (`/my-profile`) now shows a link card to the orders page:

```tsx
<a href="/orders" className="...">
  <div>View All Orders</div>
  <div>Filter by status, date range, and more</div>
</a>
```

### Back to Profile

The orders page header includes a back button:

```tsx
<button onClick={() => router.push('/my-profile')}>
  Back to Profile
</button>
```

## UX Improvements

1. **Scroll to Top**: When changing pages, the view scrolls to the top for better navigation
2. **Clear Filters**: Button to reset all filters appears when any filter is active
3. **Results Count**: Shows total number of orders found
4. **Loading State**: Spinner while fetching orders
5. **Empty State**: Helpful message when no orders found with option to clear filters

## File Location

```
frontend/app/orders/page.tsx
```

---

*Last updated: January 2026*
