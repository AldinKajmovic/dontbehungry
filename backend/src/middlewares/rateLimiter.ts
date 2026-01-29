import rateLimit from 'express-rate-limit'

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
  max: 50, 
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
