# Database Schema Documentation

## Overview

This document provides comprehensive documentation for the Glovo-Copy food delivery application database schema. The schema is built using **Prisma ORM** with **PostgreSQL** as the database provider.

## Database Configuration

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

- **Generator**: Prisma Client JS for type-safe database queries
- **Database**: PostgreSQL
- **Connection**: Configured via `DATABASE_URL` environment variable

---

## Schema Design Principles

### Third Normal Form (3NF) Compliance

The schema follows 3NF normalization rules:

1. **1NF**: All columns contain atomic values; no repeating groups
2. **2NF**: All non-key attributes are fully dependent on the primary key
3. **3NF**: No transitive dependencies; non-key attributes depend only on the primary key

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| UUID Primary Keys | Globally unique, no sequential exposure, better for distributed systems |
| Junction Tables | Proper many-to-many relationships (`UserAddress`, `RestaurantCategory`) |
| Separate Place Model | Addresses normalized to avoid duplication across users/restaurants |
| OrderItem Price Storage | Captures price at order time, independent of menu changes |

---

## Enums

### UserRole
Defines user types in the system.

| Value | Description |
|-------|-------------|
| `CUSTOMER` | Regular app user who orders food |
| `RESTAURANT_OWNER` | User who manages restaurant(s) |
| `DELIVERY_DRIVER` | User who delivers orders |
| `ADMIN` | Administrative user |
| `SUPER_ADMIN` | Full system access |

### OrderStatus
Tracks order lifecycle.

| Value | Description |
|-------|-------------|
| `PENDING` | Order placed, awaiting confirmation |
| `CONFIRMED` | Restaurant accepted the order |
| `PREPARING` | Food is being prepared |
| `READY_FOR_PICKUP` | Ready for driver pickup |
| `OUT_FOR_DELIVERY` | Driver en route to customer |
| `DELIVERED` | Order completed |
| `CANCELLED` | Order cancelled |

### PaymentStatus

| Value | Description |
|-------|-------------|
| `PENDING` | Payment initiated |
| `COMPLETED` | Payment successful |
| `FAILED` | Payment failed |
| `REFUNDED` | Payment refunded |

### PaymentMethod

| Value | Description |
|-------|-------------|
| `CASH` | Cash on delivery |
| `CREDIT_CARD` | Credit card payment |
| `DIGITAL_WALLET` | Apple Pay, Google Pay, etc. |

---

## Models

### User

Central user entity for all user types.

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  firstName     String
  lastName      String
  phone         String?
  avatarUrl     String?
  role          UserRole  @default(CUSTOMER)
  emailVerified Boolean   @default(false)
  phoneVerified Boolean   @default(false)
}
```

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `email` | String | Unique | User's email address |
| `passwordHash` | String | Required | Hashed password (never store plain text) |
| `firstName` | String | Required | User's first name |
| `lastName` | String | Required | User's last name |
| `phone` | String | Optional | Contact phone number |
| `avatarUrl` | String | Optional | Profile picture URL |
| `role` | UserRole | Default: CUSTOMER | User type |
| `emailVerified` | Boolean | Default: false | Email verification status |
| `phoneVerified` | Boolean | Default: false | Phone verification status |

**Relations:**
- `addresses` -> UserAddress[] (user's saved addresses)
- `restaurants` -> Restaurant[] (owned restaurants, if RESTAURANT_OWNER)
- `orders` -> Order[] (orders placed by user)
- `reviews` -> Review[] (reviews written)
- `deliveries` -> Order[] (orders delivered, if DELIVERY_DRIVER)

**Indexes:** `email`, `role`

---

### Place

Normalized address/location entity.

```prisma
model Place {
  id          String   @id @default(uuid())
  address     String
  city        String
  state       String?
  country     String
  postalCode  String?
}
```

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `address` | String | Required | Street address |
| `city` | String | Required | City name |
| `state` | String | Optional | State/province |
| `country` | String | Required | Country |
| `postalCode` | String | Optional | Postal/ZIP code |

**Relations:**
- `restaurants` -> Restaurant[] (restaurants at this location)
- `userAddresses` -> UserAddress[] (users with this address)
- `orders` -> Order[] (deliveries to this location)

**Indexes:** `city`, `country`

---

### UserAddress

Junction table linking users to their saved addresses.

```prisma
model UserAddress {
  id        String   @id @default(uuid())
  userId    String
  placeId   String
  isDefault Boolean  @default(false)
  notes     String?
}
```

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `userId` | String | FK -> User | User reference |
| `placeId` | String | FK -> Place | Place reference |
| `isDefault` | Boolean | Default: false | Default delivery address |
| `notes` | String | Optional | Delivery instructions |

**Constraints:**
- Unique compound: `[userId, placeId]`
- Cascade delete on User/Place deletion

**Indexes:** `userId`

---

### Restaurant

Restaurant entity with business information.

```prisma
model Restaurant {
  id              String   @id @default(uuid())
  name            String
  description     String?
  phone           String?
  email           String?
  logoUrl         String?
  coverUrl        String?
  ownerId         String
  placeId         String
  rating          Decimal  @default(0) @db.Decimal(2, 1)
  minOrderAmount  Decimal? @db.Decimal(10, 2)
  deliveryFee     Decimal? @db.Decimal(10, 2)
}
```

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `name` | String | Required | Restaurant name |
| `description` | String | Optional | About the restaurant |
| `phone` | String | Optional | Contact phone |
| `email` | String | Optional | Contact email |
| `logoUrl` | String | Optional | Logo image URL |
| `coverUrl` | String | Optional | Cover/banner image URL |
| `ownerId` | String | FK -> User | Restaurant owner |
| `placeId` | String | FK -> Place | Restaurant location |
| `rating` | Decimal(2,1) | Default: 0 | Average rating (0.0-5.0) |
| `minOrderAmount` | Decimal(10,2) | Optional | Minimum order value |
| `deliveryFee` | Decimal(10,2) | Optional | Delivery fee |

**Relations:**
- `owner` -> User (restaurant owner)
- `place` -> Place (location)
- `categories` -> RestaurantCategory[] (food categories)
- `menuItems` -> MenuItem[] (menu)
- `orders` -> Order[] (received orders)
- `reviews` -> Review[] (customer reviews)
- `openingHours` -> OpeningHours[] (business hours)

**Indexes:** `ownerId`, `placeId`, `name`

---

### Category

Food category classification.

```prisma
model Category {
  id          String  @id @default(uuid())
  name        String  @unique
  description String?
  iconUrl     String?
}
```

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `name` | String | Unique | Category name (Pizza, Sushi, etc.) |
| `description` | String | Optional | Category description |
| `iconUrl` | String | Optional | Category icon URL |

**Relations:**
- `restaurants` -> RestaurantCategory[] (restaurants in this category)
- `menuItems` -> MenuItem[] (items in this category)

**Indexes:** `name`

---

### RestaurantCategory

Many-to-many junction between Restaurant and Category.

```prisma
model RestaurantCategory {
  id           String @id @default(uuid())
  restaurantId String
  categoryId   String
}
```

**Constraints:**
- Unique compound: `[restaurantId, categoryId]`
- Cascade delete on Restaurant/Category deletion

**Indexes:** `restaurantId`, `categoryId`

---

### OpeningHours

Restaurant business hours by day of week.

```prisma
model OpeningHours {
  id           String  @id @default(uuid())
  restaurantId String
  dayOfWeek    Int
  openTime     String
  closeTime    String
  isClosed     Boolean @default(false)
}
```

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `restaurantId` | String | FK -> Restaurant | Restaurant reference |
| `dayOfWeek` | Int | 0-6 | Day (0=Sunday, 6=Saturday) |
| `openTime` | String | HH:MM format | Opening time |
| `closeTime` | String | HH:MM format | Closing time |
| `isClosed` | Boolean | Default: false | Closed this day |

**Constraints:**
- Unique compound: `[restaurantId, dayOfWeek]`

**Indexes:** `restaurantId`

---

### MenuItem

Individual menu items for a restaurant.

```prisma
model MenuItem {
  id              String  @id @default(uuid())
  name            String
  description     String?
  price           Decimal @db.Decimal(10, 2)
  imageUrl        String?
  restaurantId    String
  categoryId      String?
  isAvailable     Boolean @default(true)
  preparationTime Int?
}
```

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `name` | String | Required | Item name |
| `description` | String | Optional | Item description |
| `price` | Decimal(10,2) | Required | Current price |
| `imageUrl` | String | Optional | Item image URL |
| `restaurantId` | String | FK -> Restaurant | Parent restaurant |
| `categoryId` | String | FK -> Category | Food category |
| `isAvailable` | Boolean | Default: true | Currently available |
| `preparationTime` | Int | Optional | Prep time (minutes) |

**Relations:**
- `restaurant` -> Restaurant
- `category` -> Category (optional, SetNull on delete)
- `orderItems` -> OrderItem[] (order history)

**Indexes:** `restaurantId`, `categoryId`, `isAvailable`

---

### Order

Customer order with full details.

```prisma
model Order {
  id                String      @id @default(uuid())
  userId            String
  restaurantId      String
  deliveryPlaceId   String
  driverId          String?
  status            OrderStatus @default(PENDING)
  subtotal          Decimal     @db.Decimal(10, 2)
  deliveryFee       Decimal     @db.Decimal(10, 2)
  tax               Decimal     @db.Decimal(10, 2)
  totalAmount       Decimal     @db.Decimal(10, 2)
  notes             String?
  estimatedDelivery DateTime?
  deliveredAt       DateTime?
}
```

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `userId` | String | FK -> User | Customer |
| `restaurantId` | String | FK -> Restaurant | Restaurant |
| `deliveryPlaceId` | String | FK -> Place | Delivery address |
| `driverId` | String | FK -> User | Assigned driver (optional) |
| `status` | OrderStatus | Default: PENDING | Current status |
| `subtotal` | Decimal(10,2) | Required | Items total |
| `deliveryFee` | Decimal(10,2) | Required | Delivery charge |
| `tax` | Decimal(10,2) | Required | Tax amount |
| `totalAmount` | Decimal(10,2) | Required | Grand total |
| `notes` | String | Optional | Special instructions |
| `estimatedDelivery` | DateTime | Optional | ETA |
| `deliveredAt` | DateTime | Optional | Actual delivery time |

**Relations:**
- `user` -> User (customer)
- `restaurant` -> Restaurant
- `deliveryPlace` -> Place
- `driver` -> User (optional, SetNull on delete)
- `orderItems` -> OrderItem[]
- `payment` -> Payment (one-to-one)

**Indexes:** `userId`, `restaurantId`, `driverId`, `status`

---

### OrderItem

Line items within an order.

```prisma
model OrderItem {
  id         String  @id @default(uuid())
  orderId    String
  menuItemId String
  quantity   Int
  unitPrice  Decimal @db.Decimal(10, 2)
  totalPrice Decimal @db.Decimal(10, 2)
  notes      String?
}
```

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `orderId` | String | FK -> Order | Parent order |
| `menuItemId` | String | FK -> MenuItem | Ordered item |
| `quantity` | Int | Required | Quantity ordered |
| `unitPrice` | Decimal(10,2) | Required | Price at order time |
| `totalPrice` | Decimal(10,2) | Required | quantity * unitPrice |
| `notes` | String | Optional | Item-specific notes |

**Note:** `unitPrice` captures the price when ordered, ensuring historical accuracy even if menu prices change.

**Indexes:** `orderId`, `menuItemId`

---

### Payment

Payment information for orders.

```prisma
model Payment {
  id            String        @id @default(uuid())
  orderId       String        @unique
  amount        Decimal       @db.Decimal(10, 2)
  method        PaymentMethod
  status        PaymentStatus @default(PENDING)
}
```

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `orderId` | String | Unique, FK -> Order | Associated order |
| `amount` | Decimal(10,2) | Required | Payment amount |
| `method` | PaymentMethod | Required | Payment type |
| `status` | PaymentStatus | Default: PENDING | Payment state |

**Note:** One-to-one with Order (one payment per order).

**Indexes:** `orderId`, `status`

---

### Review

Customer reviews for restaurants.

```prisma
model Review {
  id           String  @id @default(uuid())
  userId       String
  restaurantId String
  rating       Int
  title        String?
  content      String?
}
```

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `userId` | String | FK -> User | Review author |
| `restaurantId` | String | FK -> Restaurant | Reviewed restaurant |
| `rating` | Int | 1-5 | Star rating |
| `title` | String | Optional | Review title |
| `content` | String | Optional | Review body |

**Constraints:**
- Unique compound: `[userId, restaurantId]` (one review per user per restaurant)

**Relations:**
- `user` -> User
- `restaurant` -> Restaurant

**Indexes:** `userId`, `restaurantId`, `rating`

---

## Entity Relationship Diagram

```
+--------------+                              +--------------+
|    User      |                              |    Place     |
+--------------+                              +--------------+
| id (PK)      |                              | id (PK)      |
| email        |                              | address      |
| passwordHash |                              | city         |
| firstName    |                              | state        |
| lastName     |                              | country      |
| phone        |                              | postalCode   |
| avatarUrl    |                              +------+-------+
| role         |                                     |
| emailVerified|                                     |
| phoneVerified|                                     |
+------+-------+                                     |
       |                                             |
       |     +------------------+                    |
       |     |   UserAddress    |                    |
       +---->| userId (FK)      |<-------------------+
             | placeId (FK)     |
             | isDefault        |
             | notes            |
             +------------------+

+--------------+       +-----------------+       +--------------+
|  Restaurant  |       |RestaurantCategory|      |   Category   |
+--------------+       +-----------------+       +--------------+
| id (PK)      |<------| restaurantId(FK)|       | id (PK)      |
| name         |       | categoryId (FK) |------>| name         |
| description  |       +-----------------+       | description  |
| phone        |                                 | iconUrl      |
| email        |                                 +--------------+
| logoUrl      |
| coverUrl     |       +-----------------+
| ownerId (FK) |------>|      User       |
| placeId (FK) |------>|     (owner)     |
| rating       |       +-----------------+
| minOrderAmount|
| deliveryFee  |       +-----------------+
+--------------+       | OpeningHours    |
       |               +-----------------+
       +-------------->| restaurantId(FK)|
       |               | dayOfWeek       |
       |               | openTime        |
       |               | closeTime       |
       |               | isClosed        |
       |               +-----------------+
       |
       |               +-----------------+
       +-------------->|    MenuItem     |
       |               +-----------------+
       |               | id (PK)         |
       |               | name            |
       |               | description     |
       |               | price           |
       |               | imageUrl        |
       |               | restaurantId(FK)|
       |               | categoryId (FK) |
       |               | isAvailable     |
       |               | preparationTime |
       |               +--------+--------+
       |                        |
       |                        v
       |               +-----------------+       +-----------------+
       +-------------->|     Order       |       |    OrderItem    |
                       +-----------------+       +-----------------+
                       | id (PK)         |<------| orderId (FK)    |
                       | userId (FK)     |       | menuItemId (FK) |
                       | restaurantId(FK)|       | quantity        |
                       | deliveryPlaceId |       | unitPrice       |
                       | driverId (FK)   |       | totalPrice      |
                       | status          |       | notes           |
                       | subtotal        |       +-----------------+
                       | deliveryFee     |
                       | tax             |       +-----------------+
                       | totalAmount     |       |    Payment      |
                       | notes           |       +-----------------+
                       | estimatedDelivery|<---->| orderId (FK)    |
                       | deliveredAt     |       | amount          |
                       +-----------------+       | method          |
                                                 | status          |
                                                 +-----------------+

+--------------+
|    Review    |
+--------------+
| id (PK)      |
| userId (FK)  |-----> User
| restaurantId |-----> Restaurant
| rating       |
| title        |
| content      |
+--------------+
```

---

## Indexing Strategy

Indexes are created for:

1. **Foreign Keys** - All FK columns for JOIN performance
2. **Unique Constraints** - Email, compound keys
3. **Query Filters** - Commonly filtered columns (status, role, rating)
4. **Search Fields** - name fields for search functionality

| Model | Indexed Fields |
|-------|---------------|
| User | email, role |
| Place | city, country |
| UserAddress | userId |
| Restaurant | ownerId, placeId, name |
| Category | name |
| RestaurantCategory | restaurantId, categoryId |
| OpeningHours | restaurantId |
| MenuItem | restaurantId, categoryId, isAvailable |
| Order | userId, restaurantId, driverId, status |
| OrderItem | orderId, menuItemId |
| Payment | orderId, status |
| Review | userId, restaurantId, rating |

---

## Cascade Delete Rules

| Relation | On Delete |
|----------|-----------|
| User -> UserAddress | Cascade |
| User -> Restaurant | Cascade |
| User -> Order (customer) | Cascade |
| User -> Order (driver) | SetNull |
| User -> Review | Cascade |
| Place -> UserAddress | Cascade |
| Restaurant -> RestaurantCategory | Cascade |
| Restaurant -> OpeningHours | Cascade |
| Restaurant -> MenuItem | Cascade |
| Restaurant -> Order | Cascade |
| Restaurant -> Review | Cascade |
| Category -> RestaurantCategory | Cascade |
| Category -> MenuItem | SetNull |
| Order -> OrderItem | Cascade |
| Order -> Payment | Cascade |

---

## Usage Examples

### Creating a User with Address

```typescript
const user = await prisma.user.create({
  data: {
    email: "john@example.com",
    passwordHash: hashedPassword,
    firstName: "John",
    lastName: "Doe",
    role: "CUSTOMER",
    addresses: {
      create: {
        place: {
          create: {
            address: "123 Main St",
            city: "New York",
            country: "USA",
            postalCode: "10001"
          }
        },
        isDefault: true
      }
    }
  },
  include: { addresses: { include: { place: true } } }
});
```

### Creating an Order

```typescript
const order = await prisma.order.create({
  data: {
    userId: customerId,
    restaurantId: restaurantId,
    deliveryPlaceId: placeId,
    status: "PENDING",
    subtotal: 25.00,
    deliveryFee: 3.50,
    tax: 2.85,
    totalAmount: 31.35,
    orderItems: {
      create: [
        {
          menuItemId: pizzaId,
          quantity: 2,
          unitPrice: 12.50,
          totalPrice: 25.00
        }
      ]
    },
    payment: {
      create: {
        amount: 31.35,
        method: "CREDIT_CARD",
        status: "PENDING"
      }
    }
  }
});
```

### Fetching Restaurant with Reviews

```typescript
const restaurant = await prisma.restaurant.findUnique({
  where: { id: restaurantId },
  include: {
    place: true,
    categories: { include: { category: true } },
    menuItems: { where: { isAvailable: true } },
    reviews: {
      include: {
        user: { select: { firstName: true, avatarUrl: true } }
      },
      orderBy: { rating: "desc" }
    }
  }
});
```

---

## Migration Commands

```bash
# Generate migration
npx prisma migrate dev --name <migration_name>

# Apply migrations to production
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Reset database (dev only)
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio
```
