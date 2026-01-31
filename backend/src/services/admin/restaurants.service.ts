import { prisma } from '../../lib/prisma'
import { NotFoundError } from '../../utils/errors'
import { PaginatedResponse } from '../../types'
import { PaginationParams, RestaurantFilters, CreateRestaurantData, UpdateRestaurantData } from '../../validators/admin.validator'

export async function getRestaurants(params: PaginationParams, filters: RestaurantFilters = {}): Promise<PaginatedResponse<object>> {
  const { page, limit, search, sortBy, sortOrder } = params
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' as const } },
      { email: { contains: search, mode: 'insensitive' as const } },
    ]
  }

  if (filters.ownerId) {
    where.ownerId = filters.ownerId
  }

  if (filters.minRating !== undefined || filters.maxRating !== undefined) {
    where.rating = {}
    if (filters.minRating !== undefined) (where.rating as Record<string, number>).gte = filters.minRating
    if (filters.maxRating !== undefined) (where.rating as Record<string, number>).lte = filters.maxRating
  }

  if (filters.minDeliveryFee !== undefined || filters.maxDeliveryFee !== undefined) {
    where.deliveryFee = {}
    if (filters.minDeliveryFee !== undefined) (where.deliveryFee as Record<string, number>).gte = filters.minDeliveryFee
    if (filters.maxDeliveryFee !== undefined) (where.deliveryFee as Record<string, number>).lte = filters.maxDeliveryFee
  }

  if (filters.minOrderAmount !== undefined || filters.maxOrderAmount !== undefined) {
    where.minOrderAmount = {}
    if (filters.minOrderAmount !== undefined) (where.minOrderAmount as Record<string, number>).gte = filters.minOrderAmount
    if (filters.maxOrderAmount !== undefined) (where.minOrderAmount as Record<string, number>).lte = filters.maxOrderAmount
  }

  const validSortFields = ['name', 'rating', 'deliveryFee', 'minOrderAmount']
  const orderBy = sortBy && validSortFields.includes(sortBy)
    ? { [sortBy]: sortOrder || 'asc' }
    : { name: 'asc' as const }

  const [items, total] = await Promise.all([
    prisma.restaurant.findMany({
      where,
      include: {
        owner: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        place: true,
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

export async function getRestaurantById(id: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      owner: {
        select: { id: true, email: true, firstName: true, lastName: true },
      },
      place: true,
      categories: {
        include: { category: true },
      },
    },
  })

  if (!restaurant) {
    throw new NotFoundError('Restaurant not found', `No restaurant found with ID: ${id}`)
  }

  return restaurant
}

export async function createRestaurant(data: CreateRestaurantData) {
  const owner = await prisma.user.findUnique({ where: { id: data.ownerId } })
  if (!owner) {
    throw new NotFoundError('Owner not found', `No user found with ID: ${data.ownerId}`)
  }

  const place = await prisma.place.findUnique({ where: { id: data.placeId } })
  if (!place) {
    throw new NotFoundError('Place not found', `No place found with ID: ${data.placeId}`)
  }

  const restaurant = await prisma.restaurant.create({
    data: {
      name: data.name,
      description: data.description || null,
      phone: data.phone || null,
      email: data.email || null,
      ownerId: data.ownerId,
      placeId: data.placeId,
      minOrderAmount: data.minOrderAmount || null,
      deliveryFee: data.deliveryFee || null,
    },
    include: {
      owner: {
        select: { id: true, email: true, firstName: true, lastName: true },
      },
      place: true,
    },
  })

  return restaurant
}

export async function updateRestaurant(id: string, data: UpdateRestaurantData) {
  await getRestaurantById(id)

  if (data.ownerId) {
    const owner = await prisma.user.findUnique({ where: { id: data.ownerId } })
    if (!owner) {
      throw new NotFoundError('Owner not found', `No user found with ID: ${data.ownerId}`)
    }
  }

  if (data.placeId) {
    const place = await prisma.place.findUnique({ where: { id: data.placeId } })
    if (!place) {
      throw new NotFoundError('Place not found', `No place found with ID: ${data.placeId}`)
    }
  }

  const restaurant = await prisma.restaurant.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.email !== undefined && { email: data.email || null }),
      ...(data.ownerId && { ownerId: data.ownerId }),
      ...(data.placeId && { placeId: data.placeId }),
      ...(data.minOrderAmount !== undefined && { minOrderAmount: data.minOrderAmount || null }),
      ...(data.deliveryFee !== undefined && { deliveryFee: data.deliveryFee || null }),
    },
    include: {
      owner: {
        select: { id: true, email: true, firstName: true, lastName: true },
      },
      place: true,
    },
  })

  return restaurant
}

export async function deleteRestaurant(id: string) {
  await getRestaurantById(id)
  await prisma.restaurant.delete({ where: { id } })
}
