# Reusable UI Components Guide

This guide documents the reusable UI components in `/components/ui/` designed to reduce code duplication and ensure consistency across the application.

## Components Overview

| Component | Purpose | Used In |
|-----------|---------|---------|
| Section | Card container for page sections | my-profile |
| Modal | Dialog/confirmation modals | my-profile (delete, address) |
| StatusMessage | Success/error/loading states | forgot-password, verify-email |
| FeatureCard | Feature display cards | home page |
| Divider | Text-centered divider lines | login, register |
| RestaurantCard | Restaurant listing card | restaurants page |
| CategoryIcon | Category filter button | restaurants page |
| MealModal | Meal details modal | restaurants page |
| AddressAutocomplete | Address input with map | my-profile, admin panel |
| SearchableSelect | Searchable dropdown | admin panel |

---

## Section

A card container for organizing page content into titled sections.

### Props

```typescript
interface SectionProps {
  title: string           // Section heading
  description?: string    // Optional subheading
  children: ReactNode     // Section content
  headerAction?: ReactNode // Optional button/action in header
  variant?: 'default' | 'danger'  // Styling variant
  className?: string      // Additional CSS classes
}
```

### Usage

```tsx
import { Section } from '@/components/ui'

// Basic usage
<Section title="Profile Picture">
  <p>Upload your photo...</p>
</Section>

// With description and header action
<Section
  title="My Addresses"
  description="Manage your delivery addresses"
  headerAction={<Button>Add Address</Button>}
>
  {/* Address list */}
</Section>

// Danger variant (red border)
<Section title="Danger Zone" variant="danger">
  <Button>Delete Account</Button>
</Section>
```

---

## Modal

A reusable dialog component with backdrop, icon header, and action buttons.

### Props

```typescript
interface ModalProps {
  isOpen: boolean                    // Control visibility
  onClose: () => void                // Close handler
  title: string                      // Modal title
  icon?: ReactNode                   // Optional header icon
  iconColor?: 'primary' | 'red' | 'green' | 'blue' | 'yellow'
  children: ReactNode                // Modal content
  actions?: ModalAction[]            // Bottom action buttons
  size?: 'sm' | 'md' | 'lg'         // Width (default: 'md')
  className?: string
}

interface ModalAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  loading?: boolean
  disabled?: boolean
}
```

### Usage

```tsx
import { Modal } from '@/components/ui'

// Confirmation modal
<Modal
  isOpen={showDeleteModal}
  onClose={closeModal}
  title="Delete Account?"
  icon={<TrashIcon />}
  iconColor="red"
  actions={[
    { label: 'Cancel', onClick: closeModal, variant: 'secondary' },
    { label: 'Delete', onClick: handleDelete, variant: 'danger', loading: isDeleting }
  ]}
>
  <p>Are you sure you want to delete your account?</p>
</Modal>

// Form modal (no actions prop - form handles submit)
<Modal
  isOpen={showAddressModal}
  onClose={closeModal}
  title="Add Address"
  icon={<LocationIcon />}
  size="lg"
>
  <form onSubmit={handleSubmit}>
    {/* Form fields */}
    <div className="flex gap-3 pt-2">
      <Button variant="secondary" onClick={closeModal}>Cancel</Button>
      <Button type="submit">Save</Button>
    </div>
  </form>
</Modal>
```

### Features
- Closes on Escape key press
- Closes on backdrop click
- Prevents body scroll when open
- Accessible with ARIA attributes

---

## StatusMessage

Displays success, error, loading, or info states with icon, message, and actions.

### Props

```typescript
interface StatusMessageProps {
  status: 'success' | 'error' | 'loading' | 'info'
  icon?: ReactNode           // Custom icon (default icons provided)
  title?: string             // Optional heading
  children?: ReactNode       // Message content
  actions?: StatusAction[]   // Action buttons
  className?: string
}

interface StatusAction {
  label: string
  onClick?: () => void
  href?: string              // Link destination (renders Link component)
  variant?: 'primary' | 'secondary'
  loading?: boolean
}
```

### Usage

```tsx
import { StatusMessage } from '@/components/ui'

// Success state
<StatusMessage
  status="success"
  icon={<EmailIcon />}
  actions={[{ label: 'Back to Login', href: '/auth/login', variant: 'secondary' }]}
>
  <p>Password reset email sent to {email}</p>
</StatusMessage>

// Error state (uses default error icon)
<StatusMessage
  status="error"
  title="Verification Failed"
  actions={[{ label: 'Try Again', onClick: handleRetry }]}
>
  <p>The verification link has expired.</p>
</StatusMessage>

// Loading state (shows spinner)
<StatusMessage status="loading">
  <p>Verifying your email...</p>
</StatusMessage>
```

---

## FeatureCard

A card for displaying features with icon, title, and description.

### Props

```typescript
interface FeatureCardProps {
  icon: ReactNode
  iconColor?: 'primary' | 'secondary' | 'blue' | 'green' | 'red' | 'yellow'
  title: string
  description: string
  className?: string
}
```

### Usage

```tsx
import { FeatureCard } from '@/components/ui'

<div className="grid md:grid-cols-3 gap-8">
  <FeatureCard
    icon={<ClockIcon />}
    iconColor="primary"
    title="Fast Delivery"
    description="Get your food delivered in under 30 minutes."
  />
  <FeatureCard
    icon={<CheckIcon />}
    iconColor="secondary"
    title="Quality Food"
    description="Partnered with the best local restaurants."
  />
  <FeatureCard
    icon={<PaymentIcon />}
    iconColor="blue"
    title="Easy Payment"
    description="Multiple payment options available."
  />
</div>
```

---

## Divider

A horizontal line divider, optionally with centered text.

### Props

```typescript
interface DividerProps {
  text?: string      // Centered text (optional)
  className?: string
}
```

### Usage

```tsx
import { Divider } from '@/components/ui'

// Simple line divider
<Divider />

// With text
<Divider text="or continue with" />
```

---

## Import Pattern

All components are exported from the barrel file:

```tsx
import {
  Section,
  Modal,
  StatusMessage,
  FeatureCard,
  Divider
} from '@/components/ui'

// Types are also exported
import type { ModalAction, StatusAction } from '@/components/ui'
```

---

## AddressAutocomplete

Address input with Nominatim geocoding and Leaflet map preview.

### Props

```typescript
interface AddressAutocompleteProps {
  label?: string
  placeholder?: string
  onAddressSelect: (address: {
    address: string
    city: string
    country: string
    postalCode: string
    latitude: number
    longitude: number
  }) => void
  height?: string              // Map height (default: '200px')
  initialAddress?: string      // Pre-fill search input
}
```

### Usage

```tsx
import { AddressAutocomplete } from '@/components/ui'

<AddressAutocomplete
  label="Delivery Address"
  placeholder="Search for an address..."
  onAddressSelect={(addr) => {
    setAddress(addr.address)
    setCity(addr.city)
    setCountry(addr.country)
    setPostalCode(addr.postalCode)
    setLatitude(addr.latitude)
    setLongitude(addr.longitude)
  }}
  height="150px"
/>
```

### Features
- Debounced search (300ms) using Nominatim API
- Dropdown with address suggestions
- Interactive Leaflet map with draggable marker
- Auto-fills address components (city, country, postal code)
- Captures coordinates for distance calculations

---

## SearchableSelect

Dynamic dropdown with async search and lazy loading.

### Props

```typescript
interface SearchableSelectProps {
  label?: string
  hint?: string
  error?: string
  value: string
  onChange: (value: string, label?: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  emptyMessage?: string
  loadOptions: (search: string) => Promise<SelectOption[]>
  id?: string
  initialLabel?: string
}
```

### Usage

```tsx
import { SearchableSelect } from '@/components/ui'

<SearchableSelect
  label="User"
  value={selectedUserId}
  onChange={(value, label) => setSelectedUserId(value)}
  loadOptions={(search) => adminService.getUsersForSelect(search)}
  placeholder="Search users..."
  emptyMessage="No users found"
  required
/>
```

### Features
- Debounced search (300ms) to reduce API calls
- Loads options on focus and search
- Clear button to reset selection
- Shows loading state while fetching
- Click outside to close

---

## Design Decisions

1. **Consistent styling**: All components follow the existing Tailwind patterns (rounded-xl, shadow-sm, color-100/600 pairs)
2. **Accessibility**: Modal includes ARIA attributes, keyboard handling, and focus management
3. **Flexibility**: Components accept `className` prop for customization
4. **Type safety**: All props are fully typed with TypeScript interfaces

---

*Last updated: February 2026 - Added AddressAutocomplete and SearchableSelect documentation*
