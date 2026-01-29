import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/orders',
  '/profile',
  '/settings',
]

// Routes that should redirect to home if already authenticated
const AUTH_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/register-restaurant',
]

// Routes that are always public
const PUBLIC_ROUTES = [
  '/',
  '/auth/verify-email',
  '/auth/verification-sent',
  '/auth/forgot-password',
  '/auth/reset-password',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if user has an access token cookie
  const accessToken = request.cookies.get('accessToken')?.value
  const isAuthenticated = !!accessToken

  // Check if this is a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  )

  // Check if this is an auth route (login/register)
  const isAuthRoute = AUTH_ROUTES.some((route) =>
    pathname.startsWith(route)
  )

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users from auth routes to home
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
}
