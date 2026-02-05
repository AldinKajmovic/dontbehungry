# Driver Availability API

This guide documents the driver availability tracking system that allows delivery drivers to toggle their work status and tracks hours worked automatically.

## Overview

The availability system provides:
- Toggle on/off for driver availability
- Automatic shift tracking based on actual deliveries
- Monthly hours aggregation
- Safety mechanisms to prevent manipulation

## Key Design Decisions

1. **Shift-Based Hour Calculation**: Hours are calculated from shift start (go online) to last work activity (delivered or cancelled)
2. **Cancelled Orders Count**: Cancelled orders count towards work time since they may not be the driver's fault
3. **Server-Side State**: Availability state lives in database, not browser (survives session timeouts)
4. **Safety Mechanisms**:
   - Auto-close shifts after 12 hours maximum
   - Duration calculated from shift start to last order activity
   - No hours credited if no orders were assigned during shift

## How Hours Are Calculated

**Work time = Last work activity - Shift start time**

When a driver goes online (starts shift), the clock starts. Work activity includes both **DELIVERED** and **CANCELLED** orders, since cancellations may not be the driver's fault (restaurant cancelled, customer cancelled, etc.).

| Scenario | Start Time | End Time | Duration |
|----------|------------|----------|----------|
| Normal shift with deliveries | Shift start (go online) | Last order delivered | difference |
| Order delivered then cancelled | Shift start (go online) | Whichever happened later | difference |
| All orders cancelled | Shift start (go online) | Last cancellation time | difference |
| No orders received | N/A | N/A | 0 hours |
| Forgot to go offline | Shift start (go online) | Last activity (capped at 12h) | actual work time |

## Database Schema

### ShiftStatus Enum

```prisma
enum ShiftStatus {
  ACTIVE      // Shift is currently active
  COMPLETED   // Driver manually ended shift
  AUTO_CLOSED // System auto-closed due to inactivity
}
```

### DriverShift Model

```prisma
model DriverShift {
  id              String      @id @default(uuid())
  driverId        String
  startTime       DateTime    @default(now())
  endTime         DateTime?
  status          ShiftStatus @default(ACTIVE)
  durationMinutes Int?
  autoCloseReason String?

  driver User @relation("DriverShifts", fields: [driverId], references: [id], onDelete: Cascade)

  @@index([driverId])
  @@index([driverId, status])
  @@index([startTime])
}
```

## API Endpoints

All endpoints require authentication and are restricted to users with `DELIVERY_DRIVER` role.

### POST /api/profile/availability/toggle

Toggle driver availability on/off.

**Response (Going Online)**:
```json
{
  "message": "You are now online",
  "isOnline": true,
  "currentShift": {
    "id": "uuid",
    "startTime": "2024-01-15T09:00:00.000Z",
    "elapsedMinutes": 0,
    "firstOrderTime": null,
    "workedMinutes": 0
  }
}
```

**Response (Going Offline)**:
```json
{
  "message": "You are now offline",
  "isOnline": false,
  "currentShift": null
}
```

### GET /api/profile/availability/status

Get current availability status.

**Response (Waiting for orders)**:
```json
{
  "isOnline": true,
  "currentShift": {
    "id": "uuid",
    "startTime": "2024-01-15T09:00:00.000Z",
    "elapsedMinutes": 45,
    "firstOrderTime": null,
    "workedMinutes": 0
  }
}
```

**Response (Working on orders)**:
```json
{
  "isOnline": true,
  "currentShift": {
    "id": "uuid",
    "startTime": "2024-01-15T09:00:00.000Z",
    "elapsedMinutes": 120,
    "firstOrderTime": "2024-01-15T09:30:00.000Z",
    "workedMinutes": 90
  }
}
```

### GET /api/profile/availability/hours

Get monthly hours summary.

**Query Parameters**:
- `months` (optional): Number of months to retrieve (1-12, default: 6)

**Response**:
```json
{
  "months": [
    {
      "month": "2024-01",
      "year": 2024,
      "monthNumber": 1,
      "monthName": "January",
      "totalMinutes": 2400,
      "totalHours": 40,
      "shiftCount": 12
    }
  ],
  "totalMinutes": 14400,
  "totalHours": 240
}
```

## Business Logic

### Toggle Availability

When a driver goes **online**:
1. Check if user is a delivery driver
2. Verify no active shift exists
3. Create new shift with `ACTIVE` status
4. Return status with `workedMinutes: 0` (no orders yet)

When a driver goes **offline**:
1. Find active shift
2. Find last order activity (delivered, cancelled, or in-progress) during shift
3. Calculate duration: `lastWorkTime - shiftStartTime`
4. If no orders: duration = 0
5. Update shift to `COMPLETED` with calculated duration

### Auto-Close Stale Shifts

A cron job should run `closeStaleShifts()` every 30 minutes to:
1. Find shifts active for > 12 hours
2. Find first/last order times during shift
3. Calculate actual worked duration
4. Set status to `AUTO_CLOSED` with reason

## Security Considerations

### Anti-Manipulation Measures

1. **Order-Based Calculation**: Hours tied to actual order timestamps
2. **Server-Side Timestamps**: All timestamps are generated server-side
3. **No Manual Input**: Drivers cannot manually enter hours
4. **Zero Hours for No Work**: Going online without orders = 0 hours

### Access Control

- All endpoints check for `DELIVERY_DRIVER` role
- Returns `403 Forbidden` for non-drivers

## Error Responses

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Invalid months | Months parameter out of range (1-12) |
| 403 | Not a driver | User is not a delivery driver |
| 404 | User not found | User does not exist |

## Cron Job Setup

Add the following to your cron configuration:

```bash
# Run every 30 minutes to close stale shifts
*/30 * * * * node /path/to/closeStaleShifts.job.js
```

Or use node-cron in your application:

```typescript
import cron from 'node-cron'
import { closeStaleShifts } from './services/profile'

// Run every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  const count = await closeStaleShifts()
  console.log(`Closed ${count} stale shifts`)
})
```
