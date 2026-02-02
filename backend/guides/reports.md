# Admin Reports Feature

## Overview

The Admin Reports feature provides PDF report generation with email delivery functionality. Reports can be generated for individual sections or combined into a multi-section report from the dashboard.

## Report Types

The following report types are available:

| Type | Description | Filters Supported |
|------|-------------|-------------------|
| `orders` | Order data with customers, status, totals | Status, payment status, date range, amount range |
| `restaurants` | Restaurant listings with ratings | Owner, rating range, delivery fee range |
| `users` | User accounts with roles | Role, email verification status |
| `reviews` | Customer reviews and ratings | Rating, restaurant |
| `categories` | Food categories | None |
| `menuItems` | Restaurant menu items | Restaurant, category, availability, price range |
| `places` | Delivery addresses | City, state, country, postal code |
| `combined` | Multi-section report | Sections selection |

## API Endpoints

### Download Reports

```
GET /api/admin/reports/{type}?{filters}
```

Returns a PDF file as binary data.

**Authentication**: Admin JWT required (via cookie or Bearer token)

**Rate Limit**: 5 requests per minute per user

**Query Parameters**: Vary by report type, same as admin list endpoints

**Response**: `application/pdf` binary

### Email Report

```
POST /api/admin/reports/email
```

Sends a report PDF as email attachment.

**Request Body**:
```json
{
  "reportType": "orders",
  "email": "recipient@example.com",
  "subject": "Optional custom subject",
  "message": "Optional custom message",
  "filters": {
    "status": "DELIVERED",
    "createdAtFrom": "2026-01-01"
  }
}
```

For combined reports:
```json
{
  "reportType": "combined",
  "email": "recipient@example.com",
  "sections": ["orders", "restaurants", "users"]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Report sent to recipient@example.com"
}
```

### Combined Report (Download)

```
POST /api/admin/reports/combined
```

**Request Body**:
```json
{
  "sections": ["orders", "restaurants", "users", "reviews"]
}
```

**Response**: `application/pdf` binary

## PDF Structure

Each PDF report includes:

1. **Header**
   - App branding (DontBeHungry)
   - Report title
   - Generation timestamp (human-readable format)
   - Applied filters summary
   - Date range (if applicable)

2. **Data Table**
   - Column headers with primary color background
   - Alternating row colors for readability
   - Right-aligned numeric columns
   - Truncated long text with ellipsis

3. **Footer**
   - Page numbers (e.g., "Page 1 of 3")
   - Branding ("DontBeHungry Admin Panel")

## Security Considerations

1. **Authentication**: All endpoints require admin JWT
2. **Rate Limiting**: Max 5 reports per minute per user (reduced to prevent resource exhaustion)
3. **Email Validation**: Email format validated before sending
4. **Attachment Size**: PDF limited to 10MB (returns error if exceeded)
5. **Data Scoping**: Reports only include accessible data

## Files

### Backend

- `src/services/pdf.service.ts` - Core PDF generation functions
- `src/services/admin/reports.service.ts` - Report data aggregation
- `src/routes/reports.routes.ts` - HTTP endpoints
- `src/validators/reports.validator.ts` - Request validation

### Dependencies

- `pdfkit` - PDF generation library

## Usage Examples

### Generate Orders Report with Filters

```bash
curl -X GET "http://localhost:3001/api/admin/reports/orders?status=DELIVERED&createdAtFrom=2026-01-01" \
  -H "Cookie: accessToken=your_token" \
  --output orders-report.pdf
```

### Email Combined Report

```bash
curl -X POST "http://localhost:3001/api/admin/reports/email" \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=your_token" \
  -d '{
    "reportType": "combined",
    "email": "admin@example.com",
    "sections": ["orders", "restaurants", "users"]
  }'
```

## Date Formatting

All dates in reports use human-readable format:
- Full: "February 2, 2026 at 3:45 PM"
- Short: "Feb 2, 2026"

ISO formats (e.g., "2026-02-02T15:45:00.000Z") are NOT used in the PDF output.
