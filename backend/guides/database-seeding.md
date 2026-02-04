# Database Seeding

## Overview

The database seed script populates the PostgreSQL database with realistic fake data using Faker.js. This is useful for development, testing, and demonstration purposes.

## Location

`prisma/seed.ts`

## Running the Seed

```bash
cd backend
npm run prisma:seed
```

**Prerequisites:**
- Database must be running and accessible
- Prisma migrations must be applied (`npm run prisma:migrate`)
- Prisma client must be generated (`npm run prisma:generate`)

## What Gets Created

| Entity | Count | Notes |
|--------|-------|-------|
| Admin | 1 | `admin@glovo.com` |
| Customers | 20 | Random data |
| Restaurant Owners | 10 | One per restaurant |
| Restaurants | 10 | With categories |
| Categories | 30 | Food categories |
| Menu Items | ~150 | 15 per restaurant |
| Delivery Drivers | 30 | Random data |
| Orders | ~400 | 20 per customer |
| Reviews | ~50 | 5 per restaurant (from customers who ordered) |

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@glovo.com` | `admin123` |
| Customers | `user0@test.com` - `user19@test.com` | `password123` |
| Restaurant owners | `owner0@test.com` - `owner9@test.com` | `owner123` |
| Drivers | `driver0@test.com` - `driver29@test.com` | `driver123` |

## Configuration

Edit `SEED_CONFIG` in `prisma/seed.ts` to adjust quantities:

```typescript
const SEED_CONFIG = {
  users: 20,
  restaurants: 10,
  categoriesPerRestaurant: 12,
  menuItemsPerRestaurant: 15,
  ordersPerUser: 20,
  reviewsPerRestaurant: 5,
  drivers: 30,
}
```

## Data Relationships

The seed creates realistic data relationships:

- Each restaurant has an owner (RESTAURANT_OWNER user)
- Each restaurant has a location (Place)
- Each restaurant has multiple food categories assigned
- Menu items are categorized
- Orders contain multiple items from the same restaurant
- Orders have associated payments
- Orders are assigned to drivers (except pending/cancelled orders)
- Users have default addresses
- Reviews are created by customers who have ordered from the restaurant

## Re-seeding

The seed script **clears all existing data** before inserting new records. This ensures a clean state but means existing data will be lost.

## Localization

The seed uses **Croatian locale** (`fakerHR`) from Faker.js for generating realistic Balkan-style data (closest available to Bosnian). This affects:

- User names (first name, last name)
- Phone numbers
- Street addresses
- City names
- Company/restaurant names

The country is hardcoded to "Bosna i Hercegovina" for all addresses.

## Dependencies

- `@faker-js/faker` - Generates realistic fake data (with Croatian locale for Balkan names)
- `bcryptjs` - Hashes passwords
- `@prisma/client` - Database access

---

*Last updated: February 2026*
