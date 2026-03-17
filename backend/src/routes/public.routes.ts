import { Router } from 'express'
import * as publicController from '../controllers/public.controller'
import { apiLimiter } from '../middlewares/rateLimiter'

const router = Router()

router.use(apiLimiter)

// Public restaurant endpoints (no authentication required)
router.get('/restaurants', publicController.getRestaurants)
router.post('/restaurants/search', publicController.searchRestaurants)
router.get('/restaurants/:id', publicController.getRestaurantById)
router.get('/restaurants/:id/menu-items', publicController.getRestaurantMenuItems)
router.get('/categories', publicController.getCategories)

export default router
