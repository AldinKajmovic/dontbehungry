const isProduction = process.env.NODE_ENV === 'production'

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  isProduction,
  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d',
  },
  bcrypt: {
    saltRounds: 12,
  },
  cookie: {
    secure: isProduction,
    sameSite: isProduction ? 'strict' as const : 'lax' as const,
    domain: process.env.COOKIE_DOMAIN || undefined,
    accessMaxAge: 15 * 60 * 1000, // 15 minutes in ms
    refreshMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  },
  smtp: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@glovo-clone.com',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/oauth/google/callback',
  },
} as const
