import { prisma } from '../../lib/prisma'
import { NotFoundError } from '../../utils/errors'
import { deleteFromGCS, extractGCSPath, isGCSUrl } from '../../lib/gcs'
import { PaginatedResponse } from '../../types'
import { PaginationParams, RestaurantFilters, CreateRestaurantData, UpdateRestaurantData } from '../../validators/admin'

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
      galleryImages: {
        orderBy: { sortOrder: 'asc' },
        select: { id: true, imageUrl: true, sortOrder: true },
      },
      openingHours: {
        orderBy: { dayOfWeek: 'asc' },
        select: { id: true, dayOfWeek: true, openTime: true, closeTime: true, isClosed: true },
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
      logoUrl: data.logoUrl || null,
      coverUrl: data.coverUrl || null,
      ...(data.openingHours?.length && {
        openingHours: {
          createMany: {
            data: data.openingHours.map((h) => ({
              dayOfWeek: h.dayOfWeek,
              openTime: h.openTime,
              closeTime: h.closeTime,
              isClosed: h.isClosed,
            })),
          },
        },
      }),
      ...(data.galleryImages?.length && {
        galleryImages: {
          createMany: {
            data: data.galleryImages.map((img) => ({
              imageUrl: img.imageUrl,
              sortOrder: img.sortOrder,
            })),
          },
        },
      }),
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
  const existing = await getRestaurantById(id)

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

  // Clean up old images from GCS when replaced
  if (data.logoUrl !== undefined && existing.logoUrl && isGCSUrl(existing.logoUrl) && data.logoUrl !== existing.logoUrl) {
    const oldPath = extractGCSPath(existing.logoUrl)
    if (oldPath) deleteFromGCS(oldPath)
  }
  if (data.coverUrl !== undefined && existing.coverUrl && isGCSUrl(existing.coverUrl) && data.coverUrl !== existing.coverUrl) {
    const oldPath = extractGCSPath(existing.coverUrl)
    if (oldPath) deleteFromGCS(oldPath)
  }

  const restaurant = await prisma.$transaction(async (tx) => {
    // Replace opening hours if provided
    if (data.openingHours !== undefined) {
      await tx.openingHours.deleteMany({ where: { restaurantId: id } })
      if (data.openingHours.length > 0) {
        await tx.openingHours.createMany({
          data: data.openingHours.map((h) => ({
            restaurantId: id,
            dayOfWeek: h.dayOfWeek,
            openTime: h.openTime,
            closeTime: h.closeTime,
            isClosed: h.isClosed,
          })),
        })
      }
    }

    // Replace gallery images if provided
    if (data.galleryImages !== undefined) {
      const existingImages = await tx.restaurantImage.findMany({ where: { restaurantId: id } })
      const newUrls = new Set(data.galleryImages.map((img) => img.imageUrl))
      for (const img of existingImages) {
        if (!newUrls.has(img.imageUrl) && isGCSUrl(img.imageUrl)) {
          const oldPath = extractGCSPath(img.imageUrl)
          if (oldPath) deleteFromGCS(oldPath)
        }
      }
      await tx.restaurantImage.deleteMany({ where: { restaurantId: id } })
      if (data.galleryImages.length > 0) {
        await tx.restaurantImage.createMany({
          data: data.galleryImages.map((img) => ({
            restaurantId: id,
            imageUrl: img.imageUrl,
            sortOrder: img.sortOrder,
          })),
        })
      }
    }

    return tx.restaurant.update({
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
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl || null }),
        ...(data.coverUrl !== undefined && { coverUrl: data.coverUrl || null }),
      },
      include: {
        owner: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        place: true,
      },
    })
  })

  return restaurant
}

export async function deleteRestaurant(id: string) {
  await getRestaurantById(id)
  await prisma.restaurant.delete({ where: { id } })
}
