import { Router } from 'express'
import * as profileController from '../controllers/profile'
import * as deliveryController from '../controllers/delivery.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { apiLimiter, sensitiveOpLimiter } from '../middlewares/rateLimiter'

const router = Router()

// All profile routes require authentication
router.use(authenticate)
router.use(apiLimiter)

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

// Delivery calculation
router.get('/delivery-info', deliveryController.getDeliveryInfo)

// Order endpoints
router.post('/orders', profileController.createOrder)
router.get('/my-orders', profileController.getMyOrderHistory)
router.get('/driver-orders', profileController.getDriverOrderHistory)
router.get('/my-restaurants/:restaurantId/orders', profileController.getRestaurantOrders)
router.patch('/my-restaurants/:restaurantId/orders/:orderId', profileController.updateRestaurantOrderStatus)

// Driver order assignment endpoints
router.get('/available-orders', profileController.getAvailableOrdersHandler)
router.post('/orders/:orderId/accept', profileController.acceptOrderHandler)
router.post('/orders/:orderId/deny', profileController.denyOrderHandler)

// Driver availability endpoints
router.post('/availability/toggle', profileController.toggleAvailability)
router.get('/availability/status', profileController.getAvailabilityStatus)
router.get('/availability/hours', profileController.getMonthlyHours)

// Driver location endpoints
router.post('/location', profileController.updateLocation)
router.get('/orders/:orderId/driver-location', profileController.getDriverLocation)

export default router
