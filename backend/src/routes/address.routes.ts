import { Router } from 'express'
import * as addressController from '../controllers/address.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { apiLimiter } from '../middlewares/rateLimiter'

const router = Router()

// All address routes require authentication
router.use(authenticate)
router.use(apiLimiter)

// Get all addresses
router.get('/', addressController.getAddresses)

// Add new address
router.post('/', addressController.addAddress)

// Update address
router.patch('/:id', addressController.updateAddress)

// Delete address
router.delete('/:id', addressController.deleteAddress)

// Set default address
router.post('/:id/default', addressController.setDefaultAddress)

export default router
