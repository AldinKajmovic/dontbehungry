# Frontend Guides

This folder contains documentation for the frontend codebase.

## Available Guides

| Guide | Description |
|-------|-------------|
| [api-client.md](./api-client.md) | Axios API client with auto-refresh and error handling |
| [auth.md](./auth.md) | Authentication system (login, register, route protection) |
| [my-profile-page.md](./my-profile-page.md) | Profile page features (addresses, settings, account deletion) |

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
│   └── my-profile/        # Profile management page
├── components/ui/          # Reusable UI components
├── hooks/                  # Custom React hooks
├── providers/              # React Context providers
├── services/               # API service modules
│   ├── api.ts             # Axios client configuration
│   ├── auth.ts            # Authentication service
│   ├── profile.ts         # Profile service
│   └── address.ts         # Address service
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
