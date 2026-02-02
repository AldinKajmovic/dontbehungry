import { prisma } from '../../lib/prisma'
import {
  OrderFilters,
  RestaurantFilters,
  UserFilters,
  ReviewFilters,
  MenuItemFilters,
  PlaceFilters,
} from '../../validators/admin.validator'

const MAX_REPORT_ITEMS = 1000

export async function getOrdersForReport(
  filters: OrderFilters = {}
): Promise<Record<string, unknown>[]> {
  const where: Record<string, unknown> = {}

  if (filters.status) {
    where.status = filters.status
  }

  if (filters.paymentStatus) {
    where.payment = { status: filters.paymentStatus }
  }

  if (filters.restaurantId) {
    where.restaurantId = filters.restaurantId
  }

  if (filters.customerId) {
    where.userId = filters.customerId
  }

  if (filters.driverId) {
    where.driverId = filters.driverId
  }

  if (filters.minTotalAmount !== undefined || filters.maxTotalAmount !== undefined) {
    where.totalAmount = {}
    if (filters.minTotalAmount !== undefined) {
      (where.totalAmount as Record<string, number>).gte = filters.minTotalAmount
    }
    if (filters.maxTotalAmount !== undefined) {
      (where.totalAmount as Record<string, number>).lte = filters.maxTotalAmount
    }
  }

  if (filters.createdAtFrom !== undefined || filters.createdAtTo !== undefined) {
    where.createdAt = {}
    if (filters.createdAtFrom !== undefined) {
      (where.createdAt as Record<string, Date>).gte = filters.createdAtFrom
    }
    if (filters.createdAtTo !== undefined) {
      (where.createdAt as Record<string, Date>).lte = filters.createdAtTo
    }
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      restaurant: { select: { id: true, name: true } },
      driver: { select: { id: true, email: true, firstName: true, lastName: true } },
      payment: { select: { status: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: MAX_REPORT_ITEMS,
  })

  return orders as unknown as Record<string, unknown>[]
}

export async function getRestaurantsForReport(
  filters: RestaurantFilters = {}
): Promise<Record<string, unknown>[]> {
  const where: Record<string, unknown> = {}

  if (filters.ownerId) {
    where.ownerId = filters.ownerId
  }

  if (filters.minRating !== undefined || filters.maxRating !== undefined) {
    where.rating = {}
    if (filters.minRating !== undefined) {
      (where.rating as Record<string, number>).gte = filters.minRating
    }
    if (filters.maxRating !== undefined) {
      (where.rating as Record<string, number>).lte = filters.maxRating
    }
  }

  if (filters.minDeliveryFee !== undefined || filters.maxDeliveryFee !== undefined) {
    where.deliveryFee = {}
    if (filters.minDeliveryFee !== undefined) {
      (where.deliveryFee as Record<string, number>).gte = filters.minDeliveryFee
    }
    if (filters.maxDeliveryFee !== undefined) {
      (where.deliveryFee as Record<string, number>).lte = filters.maxDeliveryFee
    }
  }

  if (filters.minOrderAmount !== undefined || filters.maxOrderAmount !== undefined) {
    where.minOrderAmount = {}
    if (filters.minOrderAmount !== undefined) {
      (where.minOrderAmount as Record<string, number>).gte = filters.minOrderAmount
    }
    if (filters.maxOrderAmount !== undefined) {
      (where.minOrderAmount as Record<string, number>).lte = filters.maxOrderAmount
    }
  }

  const restaurants = await prisma.restaurant.findMany({
    where,
    include: {
      owner: { select: { id: true, email: true, firstName: true, lastName: true } },
      place: true,
    },
    orderBy: { name: 'asc' },
    take: MAX_REPORT_ITEMS,
  })

  return restaurants as unknown as Record<string, unknown>[]
}

export async function getUsersForReport(
  filters: UserFilters = {}
): Promise<Record<string, unknown>[]> {
  const where: Record<string, unknown> = {}

  if (filters.role) {
    where.role = filters.role
  }

  if (filters.emailVerified !== undefined) {
    where.emailVerified = filters.emailVerified
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      emailVerified: true,
      phoneVerified: true,
    },
    orderBy: { lastName: 'asc' },
    take: MAX_REPORT_ITEMS,
  })

  return users as unknown as Record<string, unknown>[]
}

export async function getReviewsForReport(
  filters: ReviewFilters = {}
): Promise<Record<string, unknown>[]> {
  const where: Record<string, unknown> = {}

  if (filters.rating !== undefined) {
    where.rating = filters.rating
  }

  if (filters.restaurantId) {
    where.restaurantId = filters.restaurantId
  }

  const reviews = await prisma.review.findMany({
    where,
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
      restaurant: { select: { id: true, name: true } },
    },
    orderBy: { rating: 'desc' },
    take: MAX_REPORT_ITEMS,
  })

  return reviews as unknown as Record<string, unknown>[]
}

export async function getCategoriesForReport(): Promise<Record<string, unknown>[]> {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    take: MAX_REPORT_ITEMS,
  })

  return categories as unknown as Record<string, unknown>[]
}

export async function getMenuItemsForReport(
  filters: MenuItemFilters = {}
): Promise<Record<string, unknown>[]> {
  const where: Record<string, unknown> = {}

  if (filters.restaurantId) {
    where.restaurantId = filters.restaurantId
  }

  if (filters.categoryId) {
    where.categoryId = filters.categoryId
  }

  if (filters.isAvailable !== undefined) {
    where.isAvailable = filters.isAvailable
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {}
    if (filters.minPrice !== undefined) {
      (where.price as Record<string, number>).gte = filters.minPrice
    }
    if (filters.maxPrice !== undefined) {
      (where.price as Record<string, number>).lte = filters.maxPrice
    }
  }

  if (filters.minPrepTime !== undefined || filters.maxPrepTime !== undefined) {
    where.preparationTime = {}
    if (filters.minPrepTime !== undefined) {
      (where.preparationTime as Record<string, number>).gte = filters.minPrepTime
    }
    if (filters.maxPrepTime !== undefined) {
      (where.preparationTime as Record<string, number>).lte = filters.maxPrepTime
    }
  }

  const menuItems = await prisma.menuItem.findMany({
    where,
    include: {
      restaurant: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
    },
    orderBy: { name: 'asc' },
    take: MAX_REPORT_ITEMS,
  })

  return menuItems as unknown as Record<string, unknown>[]
}

export async function getPlacesForReport(
  filters: PlaceFilters = {}
): Promise<Record<string, unknown>[]> {
  const where: Record<string, unknown> = {}

  if (filters.city) {
    where.city = { contains: filters.city, mode: 'insensitive' }
  }

  if (filters.state) {
    where.state = { contains: filters.state, mode: 'insensitive' }
  }

  if (filters.country) {
    where.country = { contains: filters.country, mode: 'insensitive' }
  }

  if (filters.postalCode) {
    where.postalCode = filters.postalCode
  }

  const places = await prisma.place.findMany({
    where,
    orderBy: { city: 'asc' },
    take: MAX_REPORT_ITEMS,
  })

  return places as unknown as Record<string, unknown>[]
}

export async function getCombinedReportData(
  sections: string[]
): Promise<{ type: string; title: string; data: Record<string, unknown>[] }[]> {
  const results: { type: string; title: string; data: Record<string, unknown>[] }[] = []

  for (const section of sections) {
    switch (section) {
      case 'orders':
        results.push({
          type: 'orders',
          title: 'Orders',
          data: await getOrdersForReport(),
        })
        break
      case 'restaurants':
        results.push({
          type: 'restaurants',
          title: 'Restaurants',
          data: await getRestaurantsForReport(),
        })
        break
      case 'users':
        results.push({
          type: 'users',
          title: 'Users',
          data: await getUsersForReport(),
        })
        break
      case 'reviews':
        results.push({
          type: 'reviews',
          title: 'Reviews',
          data: await getReviewsForReport(),
        })
        break
      case 'categories':
        results.push({
          type: 'categories',
          title: 'Categories',
          data: await getCategoriesForReport(),
        })
        break
      case 'menuItems':
        results.push({
          type: 'menuItems',
          title: 'Menu Items',
          data: await getMenuItemsForReport(),
        })
        break
      case 'places':
        results.push({
          type: 'places',
          title: 'Places',
          data: await getPlacesForReport(),
        })
        break
    }
  }

  return results
}
