import { Router } from 'express'
import * as authController from '../controllers/auth.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { authLimiter, sensitiveOpLimiter, resendVerificationLimiter, socketTokenLimiter } from '../middlewares/rateLimiter'

const router = Router()

// Public auth routes with rate limiting
router.post('/register', authLimiter, authController.register)
router.post('/register-restaurant', authLimiter, authController.registerRestaurant)
router.post('/login', authLimiter, authController.login)

// Google OAuth
router.post('/google', authLimiter, authController.googleAuth)

// Token refresh
router.post('/refresh', authLimiter, authController.refresh)

// Logout
router.post('/logout', authController.logout)
router.post('/logout-all', authenticate, authController.logoutAll)

// Email verification
router.get('/verify-email', authController.verifyEmail)
router.post('/resend-verification', authenticate, resendVerificationLimiter, authController.resendVerification)

// Password reset
router.post('/forgot-password', sensitiveOpLimiter, authController.forgotPassword)
router.post('/reset-password', sensitiveOpLimiter, authController.resetPassword)

// Current user
router.get('/me', authenticate, authController.me)

// Socket token for real-time notifications
router.get('/socket-token', authenticate, socketTokenLimiter, authController.getSocketToken)

export default router
