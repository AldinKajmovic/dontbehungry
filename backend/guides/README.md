# Backend Guides

This folder contains documentation for the backend API.

## Available Guides

| Guide | Description |
|-------|-------------|
| [public-api.md](./public-api.md) | Public API endpoints (restaurants, categories, menu items) |

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL

## Key Files

```
backend/
├── src/
│   ├── api/index.ts           # Route aggregation
│   ├── app.ts                 # Express app setup
│   ├── controllers/           # Request handlers
│   │   ├── admin.controller.ts
│   │   └── public.controller.ts
│   ├── services/              # Business logic
│   │   ├── admin/             # Admin services
│   │   └── public/            # Public services
│   ├── routes/                # Route definitions
│   │   ├── admin.routes.ts
│   │   ├── auth.routes.ts
│   │   └── public.routes.ts
│   ├── middlewares/           # Express middlewares
│   ├── validators/            # Input validation
│   └── types/                 # TypeScript types
└── prisma/
    └── schema.prisma          # Database schema
```

## API Structure

| Path | Auth | Description |
|------|------|-------------|
| `/api/auth/*` | No | Authentication (login, register, verify) |
| `/api/public/*` | No | Public read-only access (restaurants, categories) |
| `/api/profile/*` | Yes | User profile management |
| `/api/addresses/*` | Yes | User address management |
| `/api/admin/*` | Admin | Admin CRUD operations |

## Purpose

- Document API endpoints and parameters
- Explain architectural decisions
- Provide integration examples
- Store database schema documentation

## Adding Documentation

Create new `.md` files in this directory for:
- New API endpoint groups
- Database migration notes
- Integration guides
- Service architecture documentation

---

*Last updated: January 2026*
