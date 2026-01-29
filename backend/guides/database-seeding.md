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
| Test Customer | 1 | `customer@test.com` |
| Customers | 20 | Random data |
| Restaurant Owners | 10 | One per restaurant |
| Restaurants | 10 | With opening hours |
| Categories | 10 | Food categories |
| Menu Items | ~150 | 15 per restaurant |
| Delivery Drivers | 5 | Random data |
| Orders | ~60 | 3 per customer |
| Reviews | ~80 | 8 per restaurant |

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@glovo.com` | `admin123` |
| Customer | `customer@test.com` | `test123` |
| All other users | various | `password123` |
| Restaurant owners | various | `owner123` |
| Drivers | various | `driver123` |

## Configuration

Edit `SEED_CONFIG` in `prisma/seed.ts` to adjust quantities:

```typescript
const SEED_CONFIG = {
  users: 20,
  restaurants: 10,
  categoriesPerRestaurant: 3,
  menuItemsPerRestaurant: 15,
  ordersPerUser: 3,
  reviewsPerRestaurant: 8,
}
```

## Data Relationships

The seed creates realistic data relationships:

- Each restaurant has an owner (RESTAURANT_OWNER user)
- Each restaurant has a location (Place)
- Each restaurant has opening hours (7 days)
- Menu items are categorized
- Orders contain multiple items from the same restaurant
- Orders have associated payments
- Users have default addresses

## Re-seeding

The seed script **clears all existing data** before inserting new records. This ensures a clean state but means existing data will be lost.

## Dependencies

- `@faker-js/faker` - Generates realistic fake data
- `bcryptjs` - Hashes passwords
- `@prisma/client` - Database access

---

*Last updated: January 2026*
