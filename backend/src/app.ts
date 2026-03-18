import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { config } from './config'
import api from './api'
import { errorHandler } from './middlewares/error.middleware'
import { globalLimiter } from './middlewares/rateLimiter'
import { doubleCsrfProtection } from './middlewares/csrf.middleware'

const app = express()

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
}))

// CORS configuration
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}))

// Prevent browser from caching API responses
app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, must-revalidate')
  next()
})

// Body parsing with size limit to prevent DoS via large payloads
app.use(express.json({ limit: '1mb' }))

// Cookie parsing
app.use(cookieParser())

// CSRF protection via csrf-csrf (double-submit cookie pattern)
app.use(doubleCsrfProtection)

// Health check
app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Glovo Copy API' })
})

// Double-submit CSRF protection for all state-changing API requests
app.use('/api', csrfProtection)

// Global rate limiting for all API routes
app.use('/api', globalLimiter)

// API routes
app.use('/api', api)

// Error handling
app.use(errorHandler)

export default app
