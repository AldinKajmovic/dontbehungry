# Backend - Najedise API

Express.js REST API with Socket.io real-time events, Prisma ORM, and PostgreSQL.

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js 5
- **Language**: TypeScript 5.9
- **ORM**: Prisma 7 with PostgreSQL adapter
- **Real-time**: Socket.io 4.8
- **Auth**: JWT (access + refresh tokens) with bcrypt password hashing
- **File Storage**: Google Cloud Storage with Sharp image processing
- **Email**: Nodemailer (Gmail, Mailtrap, or custom SMTP)
- **Security**: Helmet, CORS, express-rate-limit, sanitize-html
- **PDF**: PDFKit for report generation

## Getting Started

```bash
npm install
```

Create a `.env` file with the required environment variables (see `.env.example` if available), then:

```bash
npx prisma migrate dev      # Run migrations
npx prisma generate         # Generate Prisma client
npm run dev                  # Start on port 3001
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with ts-node-dev (hot reload) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled build (`dist/index.js`) |
| `npm run prisma:generate` | Regenerate Prisma client after schema changes |
| `npm run prisma:migrate` | Create and run database migrations |
| `npm run prisma:seed` | Seed database with test data |

## Project Structure

```
src/
├── api/              # Route aggregation (mounts all route groups)
├── config/           # Environment and app configuration
├── controllers/      # HTTP request/response handlers
│   ├── admin.controller.ts
│   ├── public.controller.ts
│   ├── upload.controller.ts
│   └── profile/      # Profile-related controllers
├── services/         # Business logic layer
│   ├── admin/        # Admin CRUD services
│   ├── profile/      # Profile, orders, availability, location services
│   ├── auth.service.ts
│   ├── notification.service.ts
│   └── pdf.service.ts
├── routes/           # Express route definitions
├── middlewares/      # Auth, rate limiting, admin IP check
├── validators/       # Zod validation schemas
├── socket/           # Socket.io setup and helpers (emitToUser, emitToAdmins)
├── types/            # TypeScript type definitions
├── utils/            # Helpers (errors, order status, logger)
├── lib/              # Shared libraries (Prisma client)
├── app.ts            # Express app setup (middleware, CORS, Helmet)
└── index.ts          # Server entry point (HTTP + Socket.io)
```

## Architecture

The backend follows a strict layered pattern:

```
Route -> Controller -> Service -> Prisma (Database)
```

- **Controllers** handle HTTP request/response only (parse params, call service, send response)
- **Services** contain all business logic (validation, authorization checks, database queries)
- **Validators** define Zod schemas for input validation on routes

## API Endpoints

| Path | Auth | Description |
|------|------|-------------|
| `POST /api/auth/register` | No | Register new user |
| `POST /api/auth/login` | No | Login with email/password |
| `POST /api/auth/refresh` | Cookie | Refresh access token |
| `GET /api/auth/verify-email` | No | Verify email with token |
| `POST /api/auth/forgot-password` | No | Request password reset |
| `POST /api/auth/reset-password` | No | Reset password with token |
| `GET /api/public/restaurants` | No | List restaurants |
| `GET /api/public/categories` | No | List categories |
| `GET /api/public/restaurants/:id/menu` | No | Get restaurant menu |
| `GET /api/profile/me` | Yes | Get current user profile |
| `PATCH /api/profile/me` | Yes | Update profile |
| `POST /api/profile/location` | Driver | Report driver location |
| `GET /api/profile/orders/:id/driver-location` | Yes | Track driver for an order |
| `POST /api/profile/availability/toggle` | Driver | Go online/offline |
| `GET /api/admin/*` | Admin | Full CRUD (users, restaurants, orders, etc.) |

See [`guides/`](./guides/) for full endpoint documentation.

## Database

The Prisma schema defines the following core models:

- **User** - Users with roles (Customer, Restaurant Owner, Driver, Admin, Super Admin)
- **Restaurant** - Restaurant profiles with opening hours and gallery
- **MenuItem** - Menu items with categories, pricing, and availability
- **Order** - Orders with status tracking and payment
- **Place** - Geographic locations with coordinates
- **DriverShift** - Driver shift tracking (online/offline)
- **DriverLocation** - Real-time driver GPS coordinates
- **Notification** - Push notifications
- **Review** - Customer ratings and reviews

## Real-time Events (Socket.io)

| Event | Direction | Description |
|-------|-----------|-------------|
| `notification` | Server -> Client | Order status updates, delivery alerts |
| `driver:location:update` | Server -> Customer | Live driver location during delivery |
| `admin:driver:location:update` | Server -> Admin | All driver locations for admin map |
| `driver:order:available` | Server -> Driver | New order available for pickup |
| `driver:order:removed` | Server -> Driver | Order no longer available |
| `driver:order:accepted` | Server -> Driver | Order accepted by another driver |

## Documentation

See the [`guides/`](./guides/) directory for detailed documentation on each feature area.
