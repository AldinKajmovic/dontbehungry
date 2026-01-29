import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { config } from './config'
import api from './api'
import { errorHandler } from './middlewares/error.middleware'

const app = express()

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

// CORS configuration
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}))

// Body parsing
app.use(express.json())

// Cookie parsing
app.use(cookieParser())

// Health check
app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Glovo Copy API' })
})

// API routes
app.use('/api', api)

// Error handling
app.use(errorHandler)

export default app
