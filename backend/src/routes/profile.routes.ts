import { Router } from 'express'
import * as profileController from '../controllers/profile.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { sensitiveOpLimiter } from '../middlewares/rateLimiter'

const router = Router()

// All profile routes require authentication
router.use(authenticate)

// Update profile (name, phone)
router.patch('/', profileController.updateProfile)

router.post('/change-password', sensitiveOpLimiter, profileController.changePassword)

// Update avatar URL
router.patch('/avatar', profileController.updateAvatar)

// Delete account
router.delete('/', profileController.deleteAccount)

export default router
