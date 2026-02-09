# Najedise - Food Delivery Platform

A full-stack food delivery platform where customers can browse restaurants, place orders, and track deliveries in real time. Restaurant owners manage their menus and orders, while delivery drivers handle pickups and deliveries with live location tracking.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | Node.js, Express.js 5, TypeScript |
| Database | PostgreSQL with Prisma 7 ORM |
| Real-time | Socket.io |
| Auth | JWT (access + refresh tokens), Google OAuth |
| File Storage | Google Cloud Storage |
| Maps | Leaflet + OpenStreetMap |

## User Roles

| Role | Description |
|------|-------------|
| **Customer** | Browse restaurants, place orders, track deliveries, leave reviews |
| **Restaurant Owner** | Manage restaurant profile, menu items, opening hours, and incoming orders |
| **Delivery Driver** | Go online/offline with shift tracking, accept orders, report live location |
| **Admin** | Manage all users, restaurants, orders, categories, places, reviews, and generate reports |
| **Super Admin** | Full unrestricted access |

## Key Features

### Customers
- Browse restaurants with category filtering and search
- View menus with item details, prices, and availability
- Shopping cart with delivery fee calculation (distance + weather-based)
- Place orders and choose how to pay in person
- Real-time order status updates via push notifications
- Live driver tracking on a map during delivery
- Order history with status and date filters
- Delivery address management
- Leave reviews and ratings

### Restaurant Owners
- Restaurant profile with logo, cover image, gallery, and opening hours
- Menu item management with categories, pricing, and availability
- Process incoming orders (confirm, prepare, mark ready for pickup)
- View order history and customer details

### Delivery Drivers
- Toggle online/offline with shift tracking
- Receive available order notifications in real time
- Accept or decline delivery assignments
- Automatic GPS location reporting every 60 seconds
- View delivery history and monthly hours worked

### Admin Panel
- Dashboard with platform statistics
- Full CRUD for users, restaurants, menu items, categories, places, and reviews
- Order management with status updates
- Driver management and monitoring
- Real-time driver location map
- PDF report generation with email delivery
- Advanced filtering, search, and pagination

### Platform
- Dark mode support
- Localization (English and Bosnian)
- Email verification and password reset
- Rate limiting and security headers
- Real-time notifications via WebSocket

## Project Structure

```
├── backend/              # Express.js REST API + Socket.io server
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── services/     # Business logic
│   │   ├── routes/       # Route definitions
│   │   ├── middlewares/  # Auth, rate limiting, validation
│   │   ├── validators/   # Zod input validation schemas
│   │   ├── socket/       # Socket.io setup and helpers
│   │   ├── types/        # TypeScript type definitions
│   │   └── utils/        # Helper functions
│   ├── prisma/           # Database schema and migrations
│   └── guides/           # Backend documentation
├── frontend/             # Next.js App Router application
│   ├── app/              # Pages and routing
│   ├── components/       # React components
│   ├── hooks/            # Custom React hooks
│   ├── providers/        # Context providers (Auth, Socket, Theme)
│   ├── services/         # API client modules
│   ├── locales/          # i18n translation files
│   └── guides/           # Frontend documentation
└── README.md             # This file
```

## Prerequisites

- Node.js 20+
- PostgreSQL
- Google Cloud Storage bucket (for file uploads)
- SMTP credentials (for email verification and reports)

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd dontbehungry
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` with the required environment variables (database URL, JWT secrets, SMTP credentials, GCS config, etc.).

```bash
npx prisma migrate dev      # Run database migrations
npx prisma generate         # Generate Prisma client
npm run prisma:seed          # Seed with test data (optional)
npm run dev                  # Start dev server on port 3001
```

### 3. Set up the frontend

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/` with the required environment variables (API URL, NextAuth config, etc.).

```bash
npm run dev                  # Start dev server on port 3000
```

### 4. Open the app

Visit `http://localhost:3000` in your browser.

## Default Test Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@glovo.com | admin123 |
| Customer | customer@test.com | test123 |

## Available Scripts

### Backend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled production build |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:seed` | Seed database with test data |

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Create production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## API Overview

| Path | Auth | Description |
|------|------|-------------|
| `/api/auth/*` | No | Login, register, verify email, reset password |
| `/api/public/*` | No | Browse restaurants, categories, menu items |
| `/api/profile/*` | Yes | Profile, orders, restaurant management, driver features |
| `/api/addresses/*` | Yes | Delivery address management |
| `/api/admin/*` | Admin | Full CRUD, reports, driver monitoring |

## Order Flow

```
PENDING -> CONFIRMED -> PREPARING -> READY_FOR_PICKUP -> OUT_FOR_DELIVERY -> DELIVERED
                                                                           -> CANCELLED
```

1. Customer places an order (PENDING)
2. Restaurant confirms and prepares it (CONFIRMED -> PREPARING)
3. Restaurant marks it ready (READY_FOR_PICKUP)
4. Available drivers are notified; one accepts the delivery
5. Driver picks up and delivers (OUT_FOR_DELIVERY -> DELIVERED)
6. Customer can track the driver on a live map during delivery

## Documentation

Detailed guides are available in each sub-project:

- **Backend**: See [`backend/guides/`](./backend/guides/) for API endpoints, auth, database schema, and service documentation
- **Frontend**: See [`frontend/guides/`](./frontend/guides/) for component architecture, styling, hooks, and integration guides
