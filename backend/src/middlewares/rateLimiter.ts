import rateLimit from 'express-rate-limit'

// Global rate limiter applied at the app level to all API routes
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    error: 'Too many requests',
    details: 'You have exceeded the global rate limit. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: {
    error: 'Too many requests',
    details: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
})


export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: {
    error: 'Too many requests',
    details: 'You have exceeded the rate limit. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})


export const sensitiveOpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 3, 
  message: {
    error: 'Too many requests',
    details: 'Too many attempts. Please try again in an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})


export const resendVerificationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 2,
  message: {
    error: 'Too many requests',
    details: 'Please wait before requesting another verification email.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too many requests',
    details: 'You have exceeded the admin rate limit. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

export const socketTokenLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    error: 'Too many requests',
    details: 'Too many socket token requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    error: 'Too many requests',
    details: 'Too many upload attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})
