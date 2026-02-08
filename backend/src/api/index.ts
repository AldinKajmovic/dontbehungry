import { Router } from 'express'
import authRoutes from '../routes/auth.routes'
import profileRoutes from '../routes/profile.routes'
import addressRoutes from '../routes/address.routes'
import adminRoutes from '../routes/admin.routes'
import publicRoutes from '../routes/public.routes'
import notificationRoutes from '../routes/notification.routes'
import reportsRoutes from '../routes/reports.routes'
import uploadRoutes from '../routes/upload.routes'

const api = Router()

api.use('/auth', authRoutes)
api.use('/profile', profileRoutes)
api.use('/addresses', addressRoutes)
api.use('/admin', adminRoutes)
api.use('/admin/reports', reportsRoutes)
api.use('/public', publicRoutes)
api.use('/notifications', notificationRoutes)
api.use('/upload', uploadRoutes)

export default api
