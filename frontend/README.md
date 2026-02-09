# Frontend - Najedise

Next.js 16 application with React 19, TypeScript, and Tailwind CSS. Features a customer-facing food ordering experience, restaurant owner dashboard, driver delivery interface, and a full admin panel.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19 with TypeScript 5.9
- **Styling**: Tailwind CSS 4.1
- **HTTP Client**: Axios with automatic token refresh
- **Real-time**: Socket.io client
- **Auth**: JWT cookies + NextAuth.js (Google OAuth)
- **Forms**: Zod validation, libphonenumber-js for phone numbers
- **Maps**: Leaflet + React-leaflet (driver tracking)
- **Theming**: next-themes (light/dark mode)
- **Image Handling**: react-easy-crop for avatar and image cropping

## Getting Started

```bash
npm install
```

Create a `.env` file with the required environment variables (API URL, NextAuth secret, Google OAuth credentials, etc.), then:

```bash
npm run dev       # Start on port 3000
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Create optimized production build |
| `npm start` | Serve production build |
| `npm run lint` | Run ESLint |

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Home/landing page
│   ├── auth/               # Login, register, password reset, email verify
│   ├── restaurants/        # Restaurant listing with categories
│   ├── orders/             # Order history with tracking
│   ├── my-profile/         # Profile, addresses, settings
│   └── panel/              # Admin dashboard
│       ├── users/
│       ├── restaurants/
│       ├── menu-items/
│       ├── categories/
│       ├── orders/
│       ├── drivers/
│       ├── places/
│       └── reviews/
├── components/
│   ├── ui/                 # Reusable components (Button, Modal, Toast, etc.)
│   ├── admin/              # Admin panel components (DataTable, StatsCard, etc.)
│   ├── orders/             # Order tracking modal and map
│   ├── profile/            # Profile sections and hooks
│   ├── restaurants/        # Restaurant cards, meal modal, cart
│   ├── notifications/      # Notification bell and dropdown
│   └── driver/             # Driver order queue components
├── hooks/                  # Custom React hooks
│   ├── useAuth.ts          # Authentication state
│   ├── useCart.ts          # Shopping cart
│   ├── useLanguage.ts      # i18n translations
│   ├── useToast.ts         # Toast notifications
│   └── useFormValidation.ts
├── providers/              # React Context providers
│   ├── AuthProvider.tsx    # Auth state + token refresh
│   ├── SocketProvider.tsx  # Socket.io connection
│   └── ThemeProvider.tsx   # Dark/light mode
├── services/               # API client modules
│   ├── api.ts              # Axios instance with interceptors
│   ├── auth/               # Login, register, logout
│   ├── public/             # Restaurants, categories, menus
│   ├── profile/            # Profile, orders, availability, location
│   ├── admin/              # Admin CRUD operations
│   └── notification/       # Notification service
├── locales/                # Translation files
│   ├── en.json             # English
│   └── ba.json             # Bosnian
└── proxy.ts                # Route protection middleware
```

## Pages Overview

| Route | Role | Description |
|-------|------|-------------|
| `/` | Public | Landing page with hero section |
| `/auth/login` | Public | Email/password and Google login |
| `/auth/register` | Public | Customer registration |
| `/auth/register-restaurant` | Public | Restaurant owner registration |
| `/auth/forgot-password` | Public | Request password reset email |
| `/auth/reset-password` | Public | Reset password with token |
| `/auth/verify-email` | Public | Email verification |
| `/restaurants` | Public | Browse restaurants, view menus, add to cart |
| `/orders` | Customer | Order history with status filters and driver tracking |
| `/my-profile` | Authenticated | Profile settings, addresses, password change, driver availability |
| `/panel` | Admin | Admin dashboard with stats |
| `/panel/users` | Admin | User management |
| `/panel/restaurants` | Admin | Restaurant management |
| `/panel/orders` | Admin | Order management |
| `/panel/drivers` | Admin | Driver monitoring with live map |

## Key Patterns

### API Client
Axios instance with automatic access token refresh. When a 401 response is received, the interceptor silently refreshes the token and retries the request.

### Authentication
Auth state managed via `AuthProvider` context. Protected routes are handled by the `proxy.ts` middleware. User session is restored on page load from the refresh token cookie.

### Real-time Updates
`SocketProvider` manages the Socket.io connection for authenticated users (excludes admins). Used for live order status notifications and driver location tracking.

### Localization
All user-facing strings go through the `useLanguage()` hook. Translation keys are defined in `locales/en.json` and `locales/ba.json`. Use dot notation for nested keys and `{variable}` for interpolation.

### Theming
Dark mode support via `next-themes`. Components use Tailwind's `dark:` variant for dark mode styles. The user's preference is persisted in local storage.

## Documentation

See the [`guides/`](./guides/) directory for detailed documentation on components, hooks, styling patterns, and feature implementations.
