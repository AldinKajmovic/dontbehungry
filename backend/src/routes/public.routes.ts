import { Router } from 'express'
import * as publicController from '../controllers/public.controller'

const router = Router()

// Public restaurant endpoints (no authentication required)
router.get('/restaurants', publicController.getRestaurants)
router.get('/restaurants/:id', publicController.getRestaurantById)
router.get('/restaurants/:id/menu-items', publicController.getRestaurantMenuItems)
router.get('/categories', publicController.getCategories)

export default router
