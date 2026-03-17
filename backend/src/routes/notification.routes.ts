import { Router } from 'express'
import * as notificationController from '../controllers/notification.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { apiLimiter } from '../middlewares/rateLimiter'

const router = Router()

// All notification routes require authentication
router.use(authenticate)
router.use(apiLimiter)

router.get('/', notificationController.getNotifications)
router.get('/unread-count', notificationController.getUnreadCount)
router.patch('/:id/read', notificationController.markAsRead)
router.patch('/read-all', notificationController.markAllAsRead)
router.delete('/:id', notificationController.deleteNotification)

export default router
