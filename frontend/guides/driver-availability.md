# Driver Availability Feature

This guide documents the frontend implementation of the driver availability tracking system.

## Overview

The driver availability feature allows delivery drivers to:
- Toggle their work status (online/offline)
- View current shift elapsed time
- See monthly hours summary

## Components

### DriverAvailabilitySection

Located at: `components/profile/DriverAvailabilitySection.tsx`

A section component rendered on the driver's profile page that displays:
- Current status indicator (green pulse when online, gray when offline)
- Toggle button to go online/offline
- Current shift elapsed time (updates every minute)
- Monthly hours table showing hours worked per month

**Props**: None (uses internal hook for state)

**Example Usage**:
```tsx
import { DriverAvailabilitySection } from '@/components/profile'

// In the profile page
{isDeliveryDriver && <DriverAvailabilitySection />}
```

## Hooks

### useDriverAvailability

Located at: `components/profile/hooks/useDriverAvailability.ts`

Custom hook that manages all availability state and API interactions.

**Returns**:
```typescript
{
  // State
  isDriver: boolean           // Whether current user is a driver
  isOnline: boolean           // Current online status
  currentShift: {             // Active shift info (null if offline)
    id: string
    startTime: string
    elapsedMinutes: number
  } | null
  elapsedMinutes: number      // Current shift elapsed time
  formattedElapsedTime: string // e.g., "2h 30m"
  monthlyHours: MonthlyHours[] // Last 6 months of hours
  totalHours: number          // Sum of all hours
  loading: boolean            // Initial loading state
  toggling: boolean           // Toggle in progress
  error: string | null        // Error message

  // Actions
  toggle: () => Promise<void> // Toggle availability
  refresh: () => Promise<void> // Refresh status
}
```

**Features**:
- Auto-fetches status on mount
- Updates elapsed time every minute while online
- Refreshes monthly hours after going offline

## Service Methods

Located at: `services/profile/service.ts`

### toggleAvailability()

Toggle driver availability on/off.

```typescript
const result = await profileService.toggleAvailability()
// Returns: { message, isOnline, currentShift }
```

### getAvailabilityStatus()

Get current availability status.

```typescript
const status = await profileService.getAvailabilityStatus()
// Returns: { isOnline, currentShift }
```

### getMonthlyHours(months?)

Get monthly hours summary.

```typescript
const hours = await profileService.getMonthlyHours(6)
// Returns: { months, totalMinutes, totalHours }
```

## Types

Located at: `services/profile/types.ts`

```typescript
interface AvailabilityStatus {
  isOnline: boolean
  currentShift: {
    id: string
    startTime: string
    elapsedMinutes: number
  } | null
}

interface ToggleAvailabilityResponse extends AvailabilityStatus {
  message: string
}

interface MonthlyHours {
  month: string        // YYYY-MM format
  year: number
  monthNumber: number
  monthName: string
  totalMinutes: number
  totalHours: number
  shiftCount: number
}

interface MonthlyHoursResponse {
  months: MonthlyHours[]
  totalMinutes: number
  totalHours: number
}
```

## UI States

### Loading State
Shows a spinner while fetching initial status.

### Online State
- Green pulsing indicator
- "Online" text with elapsed time
- "Go Offline" button (secondary style)

### Offline State
- Gray indicator
- "Offline" text
- "Go Online" button (primary style)

### Error State
Red alert banner at the top with error message.

## Session Recovery

The availability state is stored server-side, which means:
- If the browser session times out, the shift continues
- When the driver logs back in, they see their active shift
- They must explicitly click "Go Offline" to end the shift
- If they forget, the system auto-closes after 12 hours

## Monthly Hours Table

Displays:
- Month name and year
- Number of shifts that month
- Total hours worked
- Footer row with totals

Hours are sorted with the current month first.

## Localization

Both `DriverAvailabilitySection` and `DriverDeliveriesSection` are fully localized using the `useLanguage` hook.

### Translation Keys

Located in `locales/en.json` and `locales/ba.json` under `profile.availability` and `profile.deliveries`:

**Availability keys** (`profile.availability.*`):
- `title` - Section title
- `description` - Section description
- `online` / `offline` - Status labels
- `currentShift` - Current shift label
- `goOnline` / `goOffline` - Toggle button text
- `updating` - Loading state text
- `monthlyHours` - Table title
- `noShiftHistory` - Empty state message
- `month`, `shifts`, `hours`, `total` - Table headers
- `hoursUnit` - Hour unit suffix (e.g., "h")
- `showingLast6Months` - Footer note
- `fetchError` - Error message when fetching status fails
- `toggleError` - Error message when toggling availability fails
- `months.january` through `months.december` - Localized month names

**Deliveries keys** (`profile.deliveries.*`):
- `title` - Section title
- `description` - Section description
- `show` / `hide` - Toggle button text
- `filterByStatus` - Filter label
- `allStatuses` - Filter option
- `noDeliveries` - Empty state message
- `deliveriesFoundSingular` / `deliveriesFoundPlural` - Results count (with interpolation)
- `orderFor`, `from`, `items`, `delivered` - Card labels
- `page`, `of` - Pagination text

### Usage Example

```tsx
import { useLanguage } from '@/hooks/useLanguage'

function DriverAvailabilitySection() {
  const { t } = useLanguage()

  return (
    <Section title={t('profile.availability.title')}>
      {/* Content uses t() for all user-facing strings */}
    </Section>
  )
}
```

## Integration

The component is rendered in `app/my-profile/page.tsx`:

```tsx
{/* Driver Availability - For drivers only */}
{isDeliveryDriver && <DriverAvailabilitySection />}

{/* Driver Deliveries - For drivers only */}
{isDeliveryDriver && <DriverDeliveriesSection />}
```

The availability section appears above the deliveries section for drivers.
