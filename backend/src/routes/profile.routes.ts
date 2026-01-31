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

// Restaurant owner endpoints
router.get('/my-restaurants', profileController.getMyRestaurants)
router.post('/my-restaurants', profileController.createMyRestaurant)
router.patch('/my-restaurants/:id', profileController.updateMyRestaurant)
router.delete('/my-restaurants/:id', profileController.deleteMyRestaurant)

// Menu items for restaurant owners
router.get('/my-restaurants/:restaurantId/menu-items', profileController.getMyMenuItems)
router.post('/my-restaurants/:restaurantId/menu-items', profileController.createMyMenuItem)
router.patch('/my-restaurants/:restaurantId/menu-items/:itemId', profileController.updateMyMenuItem)
router.delete('/my-restaurants/:restaurantId/menu-items/:itemId', profileController.deleteMyMenuItem)

// Categories for dropdown
router.get('/categories', profileController.getCategories)

// Order history endpoints
router.get('/my-orders', profileController.getMyOrderHistory)
router.get('/driver-orders', profileController.getDriverOrderHistory)
router.get('/my-restaurants/:restaurantId/orders', profileController.getRestaurantOrders)

export default router
