import { Router } from 'express'
import * as adminController from '../controllers/admin.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { adminOnly } from '../middlewares/adminOnly.middleware'
import { ipWhitelist } from '../middlewares/ipWhitelist.middleware'
import { adminLimiter } from '../middlewares/rateLimiter'

const router = Router()

router.use(authenticate)
router.use(adminOnly)
router.use(ipWhitelist)
router.use(adminLimiter)

// Verify access
router.get('/verify-access', adminController.verifyAccess)

// Stats
router.get('/stats', adminController.getStats)

// Users CRUD
router.get('/users', adminController.getUsers)
router.get('/users/:id', adminController.getUserById)
router.post('/users', adminController.createUser)
router.patch('/users/:id', adminController.updateUser)
router.delete('/users/:id', adminController.deleteUser)

// Restaurants CRUD
router.get('/restaurants', adminController.getRestaurants)
router.get('/restaurants/:id', adminController.getRestaurantById)
router.post('/restaurants', adminController.createRestaurant)
router.patch('/restaurants/:id', adminController.updateRestaurant)
router.delete('/restaurants/:id', adminController.deleteRestaurant)

// Categories CRUD
router.get('/categories', adminController.getCategories)
router.get('/categories/:id', adminController.getCategoryById)
router.post('/categories', adminController.createCategory)
router.patch('/categories/:id', adminController.updateCategory)
router.delete('/categories/:id', adminController.deleteCategory)

// Menu Items CRUD
router.get('/menu-items', adminController.getMenuItems)
router.get('/menu-items/:id', adminController.getMenuItemById)
router.post('/menu-items', adminController.createMenuItem)
router.patch('/menu-items/:id', adminController.updateMenuItem)
router.delete('/menu-items/:id', adminController.deleteMenuItem)

// Orders CRUD
router.get('/orders', adminController.getOrders)
router.get('/orders/:id', adminController.getOrderById)
router.post('/orders', adminController.createOrder)
router.patch('/orders/:id', adminController.updateOrder)
router.delete('/orders/:id', adminController.deleteOrder)

// Reviews CRUD
router.get('/reviews', adminController.getReviews)
router.get('/reviews/:id', adminController.getReviewById)
router.post('/reviews', adminController.createReview)
router.patch('/reviews/:id', adminController.updateReview)
router.delete('/reviews/:id', adminController.deleteReview)

// Places CRUD
router.get('/places', adminController.getPlaces)
router.get('/places/:id', adminController.getPlaceById)
router.post('/places', adminController.createPlace)
router.patch('/places/:id', adminController.updatePlace)
router.delete('/places/:id', adminController.deletePlace)

// Payments 
router.get('/payments', adminController.getPayments)
router.get('/payments/:id', adminController.getPaymentById)
router.patch('/payments/:id', adminController.updatePayment)

export default router
