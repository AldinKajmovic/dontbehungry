import { Router } from 'express'
import authRoutes from '../routes/auth.routes'
import profileRoutes from '../routes/profile.routes'
import addressRoutes from '../routes/address.routes'
import adminRoutes from '../routes/admin.routes'
import publicRoutes from '../routes/public.routes'
import notificationRoutes from '../routes/notification.routes'

const api = Router()

api.use('/auth', authRoutes)
api.use('/profile', profileRoutes)
api.use('/addresses', addressRoutes)
api.use('/admin', adminRoutes)
api.use('/public', publicRoutes)
api.use('/notifications', notificationRoutes)

export default api
