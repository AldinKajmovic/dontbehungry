const isProduction = process.env.NODE_ENV === 'production'

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

// Security: Fail loudly in production if critical env vars are missing
if (isProduction) {
  const requiredEnvVars = ['FRONTEND_URL', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS']
  const missing = requiredEnvVars.filter(v => !process.env[v])
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables in production: ${missing.join(', ')}`)
  }
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  frontendUrl: process.env.FRONTEND_URL || (isProduction ? '' : 'http://localhost:3000'),
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
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || (isProduction ? '' : 'http://localhost:3001/api/oauth/google/callback'),
  },
  admin: {
    whitelistedIPs: process.env.ADMIN_WHITELISTED_IPS?.split(',').map(ip => ip.trim()).filter(Boolean) || [],
  },
  // Google Cloud Storage bucket configuration for storing user-uploaded images
  gcs: {
    bucketName: process.env.GCS_BUCKET_NAME || '',
    projectId: process.env.GCS_PROJECT_ID || '',
    credentials: process.env.GCS_CREDENTIALS || '',
  },
} as const
