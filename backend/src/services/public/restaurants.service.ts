import { prisma } from '../../lib/prisma'
import { NotFoundError } from '../../utils/errors'
import { PaginatedResponse } from '../../types'

export interface PublicRestaurantFilters {
  categoryId?: string
  minRating?: number
}

export interface PublicPaginationParams {
  page: number
  limit: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export async function getPublicRestaurants(
  params: PublicPaginationParams,
  filters: PublicRestaurantFilters = {}
): Promise<PaginatedResponse<object>> {
  const { page, limit, search, sortBy, sortOrder } = params
  const skip = (page - 1) * limit

  const where: Record<string, any> = {}

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' as const } },
      { description: { contains: search, mode: 'insensitive' as const } },
    ]
  }

  if (filters.categoryId) {
    where.categories = {
      some: {
        categoryId: filters.categoryId,
      },
    }
  }

  if (filters.minRating !== undefined) {
    where.rating = { gte: filters.minRating }
  }

  const validSortFields = ['name', 'rating', 'deliveryFee']
  const orderBy = sortBy && validSortFields.includes(sortBy)
    ? { [sortBy]: sortOrder || 'asc' }
    : { name: 'asc' as const }

  const [items, total] = await Promise.all([
    prisma.restaurant.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        logoUrl: true,
        coverUrl: true,
        rating: true,
        deliveryFee: true,
        minOrderAmount: true,
        categories: {
          include: { category: true },
        },
        place: {
          select: { city: true, address: true },
        },
      },
      skip,
      take: limit,
      orderBy,
    }),
    prisma.restaurant.count({ where }),
  ])

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getPublicRestaurantById(id: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      logoUrl: true,
      coverUrl: true,
      rating: true,
      deliveryFee: true,
      minOrderAmount: true,
      phone: true,
      email: true,
      categories: {
        include: { category: true },
      },
      place: {
        select: { city: true, address: true, country: true },
      },
      openingHours: true,
    },
  })

  if (!restaurant) {
    throw new NotFoundError('Restaurant not found', `No restaurant found with ID: ${id}`)
  }

  return restaurant
}

export async function getPublicCategories() {
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      iconUrl: true,
    },
    orderBy: { name: 'asc' },
  })

  return categories
}

export async function getRestaurantMenuItems(restaurantId: string, categoryId?: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  })

  if (!restaurant) {
    throw new NotFoundError('Restaurant not found', `No restaurant found with ID: ${restaurantId}`)
  }

  const where: Record<string, any> = {
    restaurantId,
    isAvailable: true,
  }

  if (categoryId) {
    where.categoryId = categoryId
  }

  const menuItems = await prisma.menuItem.findMany({
    where,
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      imageUrl: true,
      preparationTime: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [
      { category: { name: 'asc' } },
      { name: 'asc' },
    ],
  })

  const groupedByCategory = menuItems.reduce((acc, item) => {
    const categoryName = item.category?.name || 'Other'
    const categoryId = item.category?.id || 'other'

    if (!acc[categoryId]) {
      acc[categoryId] = {
        categoryId,
        categoryName,
        items: [],
      }
    }
    acc[categoryId].items.push(item)
    return acc
  }, {} as Record<string, { categoryId: string; categoryName: string; items: typeof menuItems }>)

  return Object.values(groupedByCategory)
}
