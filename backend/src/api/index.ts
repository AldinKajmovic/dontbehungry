import { Router } from 'express'
import authRoutes from '../routes/auth.routes'
import profileRoutes from '../routes/profile.routes'
import addressRoutes from '../routes/address.routes'
import adminRoutes from '../routes/admin.routes'
import publicRoutes from '../routes/public.routes'

const api = Router()

api.use('/auth', authRoutes)
api.use('/profile', profileRoutes)
api.use('/addresses', addressRoutes)
api.use('/admin', adminRoutes)
api.use('/public', publicRoutes)

export default api
