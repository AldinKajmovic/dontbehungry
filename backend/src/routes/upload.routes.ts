import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware'
import { uploadSingle } from '../middlewares/upload.middleware'
import { uploadLimiter } from '../middlewares/rateLimiter'
import { uploadImage, deleteImage } from '../controllers/upload.controller'

const router = Router()

router.use(authenticate)
router.use(uploadLimiter)

router.post('/', uploadSingle, uploadImage)
router.delete('/', deleteImage)

export default router
