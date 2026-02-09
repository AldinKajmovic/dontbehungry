# Frontend Guides

This folder contains documentation for the frontend codebase.

## Available Guides

| Guide | Description |
|-------|-------------|
| [api-client.md](./api-client.md) | Axios API client with auto-refresh and error handling |
| [auth.md](./auth.md) | Authentication system (login, register, route protection) |
| [my-profile-page.md](./my-profile-page.md) | Profile page features (addresses, settings, account deletion) |
| [restaurants-page.md](./restaurants-page.md) | Restaurants listing page with categories and meal modal |
| [orders-page.md](./orders-page.md) | Order history page with status and date filters |
| [reusable-components.md](./reusable-components.md) | Reusable UI components documentation |
| [admin-panel.md](./admin-panel.md) | Admin panel features and components |
| [styling.md](./styling.md) | Styling & theming: colors, dark mode, hover effects, patterns |

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: React Context (AuthProvider)
- **HTTP Client**: Axios
- **Validation**: Zod + libphonenumber-js

## Key Files

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── restaurants/       # Restaurants listing page
│   └── my-profile/        # Profile management page
├── components/
│   ├── ui/                # Reusable UI components
│   └── restaurants/       # Restaurant-specific components
├── hooks/                  # Custom React hooks
├── providers/              # React Context providers
├── services/               # API service modules
│   ├── api.ts             # Axios client configuration
│   ├── auth/              # Authentication service
│   ├── public/            # Public API service (restaurants, categories)
│   ├── profile/           # Profile service
│   └── address/           # Address service
└── proxy.ts               # Route protection (Next.js 16+)
```

## Purpose
- Document architectural decisions
- Explain complex component implementations
- Provide API integration guides
- Store UI/UX pattern documentation

## Adding Documentation
Create new `.md` files in this directory for:
- Component design decisions
- State management patterns
- Form validation approaches
- API client implementations
