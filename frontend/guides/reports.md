# Admin Reports Feature

## Overview

The Admin Reports feature allows administrators to generate PDF reports for various data sections and either download them directly or send them via email.

## Components

### ReportButton

A dropdown button component for triggering report generation.

**Location**: `/components/admin/ReportButton.tsx`

**Props**:
```typescript
interface ReportButtonProps {
  reportType: ReportType  // 'orders' | 'restaurants' | 'users' | 'reviews' | 'categories' | 'menuItems' | 'places'
  filters?: Record<string, string | undefined>  // Current page filters
  onEmailClick: () => void  // Callback to open email modal
}
```

**Usage**:
```tsx
<ReportButton
  reportType="orders"
  filters={filters}
  onEmailClick={() => setShowEmailReportModal(true)}
/>
```

**Features**:
- Dropdown with "Download PDF" and "Email Report" options
- Loading state during PDF generation
- Click-outside to close dropdown

### EmailReportModal

A modal form for sending reports via email.

**Location**: `/components/admin/EmailReportModal.tsx`

**Props**:
```typescript
interface EmailReportModalProps {
  isOpen: boolean
  onClose: () => void
  reportType: ReportType
  filters?: Record<string, string | undefined>
}
```

**Usage**:
```tsx
<EmailReportModal
  isOpen={showEmailReportModal}
  onClose={() => setShowEmailReportModal(false)}
  reportType="orders"
  filters={filters}
/>
```

**Fields**:
- **Email** (required): Recipient email address
- **Subject** (optional): Custom email subject (defaults to "Admin Report - {Section} - {Date}")
- **Message** (optional): Custom message body

### CombinedReportModal

A modal for generating multi-section combined reports from the dashboard.

**Location**: `/components/admin/CombinedReportModal.tsx`

**Props**:
```typescript
interface CombinedReportModalProps {
  isOpen: boolean
  onClose: () => void
}
```

**Usage**:
```tsx
<CombinedReportModal
  isOpen={showReportModal}
  onClose={() => setShowReportModal(false)}
/>
```

**Features**:
- Section selector with checkboxes for all available sections
- Select All / Clear buttons
- Toggle between Download and Email delivery methods
- Email fields appear when Email mode is selected

## Reports Service

**Location**: `/services/admin/reports.service.ts`

### Methods

#### downloadReport
Downloads a single section report as PDF.
```typescript
await reportsService.downloadReport(reportType, filters)
```

#### downloadCombinedReport
Downloads a multi-section combined report as PDF.
```typescript
await reportsService.downloadCombinedReport(['orders', 'restaurants', 'users'])
```

#### emailReport
Sends a report via email.
```typescript
await reportsService.emailReport({
  reportType: 'orders',
  email: 'admin@example.com',
  subject: 'Optional custom subject',
  message: 'Optional message',
  filters: { status: 'DELIVERED' }
})
```

## Integration Pattern

Each admin page integrates reports as follows:

1. **Import components**:
```tsx
import { ReportButton } from '@/components/admin/ReportButton'
import { EmailReportModal } from '@/components/admin/EmailReportModal'
```

2. **Add state**:
```tsx
const [showEmailReportModal, setShowEmailReportModal] = useState(false)
```

3. **Add to header** (wrap existing button with flex container):
```tsx
<div className="flex items-center gap-3">
  <ReportButton
    reportType="orders"
    filters={filters}
    onEmailClick={() => setShowEmailReportModal(true)}
  />
  {/* existing button */}
</div>
```

4. **Add modal at end**:
```tsx
<EmailReportModal
  isOpen={showEmailReportModal}
  onClose={() => setShowEmailReportModal(false)}
  reportType="orders"
  filters={filters}
/>
```

## Pages with Report Button

| Page | Report Type | Filters Passed |
|------|-------------|----------------|
| `/panel/orders` | orders | Order filters (status, payment, dates, etc.) |
| `/panel/restaurants` | restaurants | Restaurant filters (owner, rating, fees) |
| `/panel/users` | users | User filters (role, verification) |
| `/panel/reviews` | reviews | Review filters (rating, restaurant) |
| `/panel/categories` | categories | Empty object `{}` |
| `/panel/menu-items` | menuItems | Menu item filters (restaurant, category, price) |
| `/panel/places` | places | Place filters (city, state, country) |
| `/panel` (dashboard) | combined | Section selector modal |

## Report Types

```typescript
type ReportType =
  | 'orders'
  | 'restaurants'
  | 'users'
  | 'reviews'
  | 'categories'
  | 'menuItems'
  | 'places'
```

## User Flow

### Per-Section Report
1. User navigates to an admin page (e.g., Orders)
2. User applies filters if desired
3. User clicks "Report" button
4. User selects "Download PDF" or "Email Report"
5. For download: PDF downloads immediately
6. For email: Modal opens to enter recipient details

### Combined Report (Dashboard)
1. User navigates to Dashboard
2. User clicks "Generate Report" button
3. User selects sections to include
4. User chooses Download or Email delivery
5. Report generates with all selected sections
