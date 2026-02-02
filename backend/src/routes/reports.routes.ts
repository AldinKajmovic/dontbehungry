import { Router, Response, NextFunction } from 'express'
import { authenticate } from '../middlewares/auth.middleware'
import { adminOnly } from '../middlewares/adminOnly.middleware'
import { ipWhitelist } from '../middlewares/ipWhitelist.middleware'
import { AuthenticatedRequest } from '../types'
import rateLimit from 'express-rate-limit'
import {
  getOrdersForReport,
  getRestaurantsForReport,
  getUsersForReport,
  getReviewsForReport,
  getCategoriesForReport,
  getMenuItemsForReport,
  getPlacesForReport,
  getCombinedReportData,
} from '../services/admin/reports.service'
import {
  createOrdersReport,
  createRestaurantsReport,
  createUsersReport,
  createReviewsReport,
  createCategoriesReport,
  createMenuItemsReport,
  createPlacesReport,
  createCombinedReport,
  pdfToBuffer,
} from '../services/pdf.service'
import { sendReportEmail } from '../services/email.service'
import {
  validateOrderFilters,
  validateRestaurantFilters,
  validateUserFilters,
  validateReviewFilters,
  validateMenuItemFilters,
  validatePlaceFilters,
} from '../validators/admin.validator'
import {
  validateEmailReportData,
  validateCombinedReportData,
  createFilterDescription,
  parseDateFilter,
} from '../validators/reports.validator'
import { logger } from '../utils/logger'

const router = Router()

const reportLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5, 
  message: { error: 'Too many report requests, please try again later' },
  keyGenerator: (req) => (req as AuthenticatedRequest).user?.userId || 'anonymous',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
})

router.use(authenticate)
router.use(adminOnly)
router.use(ipWhitelist)
router.use(reportLimiter)

function sendPdfResponse(
  res: Response,
  buffer: Buffer,
  filename: string
): void {
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.setHeader('Content-Length', buffer.length)
  res.send(buffer)
}

router.get('/orders', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const filters = validateOrderFilters({
      status: req.query.status as string,
      paymentStatus: req.query.paymentStatus as string,
      restaurantId: req.query.restaurantId as string,
      customerId: req.query.customerId as string,
      driverId: req.query.driverId as string,
      minTotalAmount: req.query.minTotalAmount as string,
      maxTotalAmount: req.query.maxTotalAmount as string,
      createdAtFrom: req.query.createdAtFrom as string,
      createdAtTo: req.query.createdAtTo as string,
    })

    const data = await getOrdersForReport(filters)
    const filterDesc = createFilterDescription(filters)
    const dateRange = {
      from: parseDateFilter(req.query.createdAtFrom as string),
      to: parseDateFilter(req.query.createdAtTo as string),
    }

    const doc = createOrdersReport(data, filterDesc, dateRange)
    const buffer = await pdfToBuffer(doc)

    const timestamp = new Date().toISOString().split('T')[0]
    sendPdfResponse(res, buffer, `orders-report-${timestamp}.pdf`)
  } catch (error) {
    next(error)
  }
})

router.get('/restaurants', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const filters = validateRestaurantFilters({
      ownerId: req.query.ownerId as string,
      minRating: req.query.minRating as string,
      maxRating: req.query.maxRating as string,
      minDeliveryFee: req.query.minDeliveryFee as string,
      maxDeliveryFee: req.query.maxDeliveryFee as string,
      minOrderAmount: req.query.minOrderAmount as string,
      maxOrderAmount: req.query.maxOrderAmount as string,
    })

    const data = await getRestaurantsForReport(filters)
    const filterDesc = createFilterDescription(filters)

    const doc = createRestaurantsReport(data, filterDesc)
    const buffer = await pdfToBuffer(doc)

    const timestamp = new Date().toISOString().split('T')[0]
    sendPdfResponse(res, buffer, `restaurants-report-${timestamp}.pdf`)
  } catch (error) {
    next(error)
  }
})

router.get('/users', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const filters = validateUserFilters({
      role: req.query.role as string,
      emailVerified: req.query.emailVerified as string,
    })

    const data = await getUsersForReport(filters)
    const filterDesc = createFilterDescription(filters)

    const doc = createUsersReport(data, filterDesc)
    const buffer = await pdfToBuffer(doc)

    const timestamp = new Date().toISOString().split('T')[0]
    sendPdfResponse(res, buffer, `users-report-${timestamp}.pdf`)
  } catch (error) {
    next(error)
  }
})

router.get('/reviews', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const filters = validateReviewFilters({
      rating: req.query.rating as string,
      restaurantId: req.query.restaurantId as string,
    })

    const data = await getReviewsForReport(filters)
    const filterDesc = createFilterDescription(filters)

    const doc = createReviewsReport(data, filterDesc)
    const buffer = await pdfToBuffer(doc)

    const timestamp = new Date().toISOString().split('T')[0]
    sendPdfResponse(res, buffer, `reviews-report-${timestamp}.pdf`)
  } catch (error) {
    next(error)
  }
})

router.get('/categories', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await getCategoriesForReport()

    const doc = createCategoriesReport(data)
    const buffer = await pdfToBuffer(doc)

    const timestamp = new Date().toISOString().split('T')[0]
    sendPdfResponse(res, buffer, `categories-report-${timestamp}.pdf`)
  } catch (error) {
    next(error)
  }
})

router.get('/menuItems', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const filters = validateMenuItemFilters({
      restaurantId: req.query.restaurantId as string,
      categoryId: req.query.categoryId as string,
      isAvailable: req.query.isAvailable as string,
      minPrice: req.query.minPrice as string,
      maxPrice: req.query.maxPrice as string,
      minPrepTime: req.query.minPrepTime as string,
      maxPrepTime: req.query.maxPrepTime as string,
    })

    const data = await getMenuItemsForReport(filters)
    const filterDesc = createFilterDescription(filters)

    const doc = createMenuItemsReport(data, filterDesc)
    const buffer = await pdfToBuffer(doc)

    const timestamp = new Date().toISOString().split('T')[0]
    sendPdfResponse(res, buffer, `menu-items-report-${timestamp}.pdf`)
  } catch (error) {
    next(error)
  }
})

router.get('/places', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const filters = validatePlaceFilters({
      city: req.query.city as string,
      state: req.query.state as string,
      country: req.query.country as string,
      postalCode: req.query.postalCode as string,
    })

    const data = await getPlacesForReport(filters)
    const filterDesc = createFilterDescription(filters)

    const doc = createPlacesReport(data, filterDesc)
    const buffer = await pdfToBuffer(doc)

    const timestamp = new Date().toISOString().split('T')[0]
    sendPdfResponse(res, buffer, `places-report-${timestamp}.pdf`)
  } catch (error) {
    next(error)
  }
})

router.post('/combined', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    validateCombinedReportData(req.body)

    const { sections } = req.body
    const sectionData = await getCombinedReportData(sections)

    const doc = createCombinedReport(sectionData)
    const buffer = await pdfToBuffer(doc)

    const timestamp = new Date().toISOString().split('T')[0]
    sendPdfResponse(res, buffer, `combined-report-${timestamp}.pdf`)
  } catch (error) {
    next(error)
  }
})

router.post('/email', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    validateEmailReportData(req.body)

    const { reportType, email, subject, message, filters = {}, sections } = req.body
    let buffer: Buffer
    let reportName: string

    switch (reportType) {
      case 'orders': {
        const orderFilters = validateOrderFilters(filters as Record<string, string>)
        const data = await getOrdersForReport(orderFilters)
        const filterDesc = createFilterDescription(orderFilters)
        const dateRange = {
          from: parseDateFilter(filters.createdAtFrom as string),
          to: parseDateFilter(filters.createdAtTo as string),
        }
        const doc = createOrdersReport(data, filterDesc, dateRange)
        buffer = await pdfToBuffer(doc)
        reportName = 'Orders'
        break
      }
      case 'restaurants': {
        const restaurantFilters = validateRestaurantFilters(filters as Record<string, string>)
        const data = await getRestaurantsForReport(restaurantFilters)
        const filterDesc = createFilterDescription(restaurantFilters)
        const doc = createRestaurantsReport(data, filterDesc)
        buffer = await pdfToBuffer(doc)
        reportName = 'Restaurants'
        break
      }
      case 'users': {
        const userFilters = validateUserFilters(filters as Record<string, string>)
        const data = await getUsersForReport(userFilters)
        const filterDesc = createFilterDescription(userFilters)
        const doc = createUsersReport(data, filterDesc)
        buffer = await pdfToBuffer(doc)
        reportName = 'Users'
        break
      }
      case 'reviews': {
        const reviewFilters = validateReviewFilters(filters as Record<string, string>)
        const data = await getReviewsForReport(reviewFilters)
        const filterDesc = createFilterDescription(reviewFilters)
        const doc = createReviewsReport(data, filterDesc)
        buffer = await pdfToBuffer(doc)
        reportName = 'Reviews'
        break
      }
      case 'categories': {
        const data = await getCategoriesForReport()
        const doc = createCategoriesReport(data)
        buffer = await pdfToBuffer(doc)
        reportName = 'Categories'
        break
      }
      case 'menu-items': {
        const menuItemFilters = validateMenuItemFilters(filters as Record<string, string>)
        const data = await getMenuItemsForReport(menuItemFilters)
        const filterDesc = createFilterDescription(menuItemFilters)
        const doc = createMenuItemsReport(data, filterDesc)
        buffer = await pdfToBuffer(doc)
        reportName = 'Menu Items'
        break
      }
      case 'places': {
        const placeFilters = validatePlaceFilters(filters as Record<string, string>)
        const data = await getPlacesForReport(placeFilters)
        const filterDesc = createFilterDescription(placeFilters)
        const doc = createPlacesReport(data, filterDesc)
        buffer = await pdfToBuffer(doc)
        reportName = 'Places'
        break
      }
      case 'combined': {
        const sectionData = await getCombinedReportData(sections as string[])
        const doc = createCombinedReport(sectionData)
        buffer = await pdfToBuffer(doc)
        reportName = 'Combined'
        break
      }
      default:
        throw new Error(`Unknown report type: ${reportType}`)
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (buffer.length > maxSize) {
      return res.status(400).json({
        error: 'Report too large',
        details: 'The generated report exceeds the maximum size of 10MB. Please apply filters to reduce the data.',
      })
    }

    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `${reportType}-report-${timestamp}.pdf`
    const emailSubject = subject || `Admin Report - ${reportName} - ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
    await sendReportEmail(email, emailSubject, message || '', buffer, filename)

    logger.info('Report email sent', {
      reportType,
      email,
      filename,
      sizeBytes: buffer.length,
    })

    res.json({
      success: true,
      message: `Report sent to ${email}`,
    })
  } catch (error) {
    next(error)
  }
})

export default router
