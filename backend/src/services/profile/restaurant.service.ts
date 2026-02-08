// Restaurant owner CRUD: getMyRestaurants, createMyRestaurant, updateMyRestaurant, deleteMyRestaurant
import { prisma } from '../../lib/prisma'
import { NotFoundError } from '../../utils/errors'
import { geocodeAddress } from '../../utils/geocoding'
import { logger } from '../../utils/logger'
import { deleteFromGCS, extractGCSPath, isGCSUrl } from '../../lib/gcs'
import {
  MyRestaurantResponse,
  CreateMyRestaurantData,
  UpdateMyRestaurantData,
  OpeningHoursResponse,
  GalleryImageResponse,
} from './types'

const restaurantSelect = {
  id: true,
  name: true,
  description: true,
  phone: true,
  email: true,
  logoUrl: true,
  coverUrl: true,
  rating: true,
  minOrderAmount: true,
  deliveryFee: true,
  place: {
    select: {
      id: true,
      address: true,
      city: true,
      country: true,
    },
  },
  openingHours: {
    select: {
      id: true,
      dayOfWeek: true,
      openTime: true,
      closeTime: true,
      isClosed: true,
    },
    orderBy: { dayOfWeek: 'asc' as const },
  },
  galleryImages: {
    select: {
      id: true,
      imageUrl: true,
      sortOrder: true,
    },
    orderBy: { sortOrder: 'asc' as const },
  },
}

function formatRestaurant(restaurant: {
  id: string
  name: string
  description: string | null
  phone: string | null
  email: string | null
  logoUrl: string | null
  coverUrl: string | null
  rating: { toString(): string }
  minOrderAmount: { toString(): string } | null
  deliveryFee: { toString(): string } | null
  place: { id: string; address: string; city: string; country: string }
  openingHours: OpeningHoursResponse[]
  galleryImages: GalleryImageResponse[]
}): MyRestaurantResponse {
  return {
    id: restaurant.id,
    name: restaurant.name,
    description: restaurant.description,
    phone: restaurant.phone,
    email: restaurant.email,
    logoUrl: restaurant.logoUrl,
    coverUrl: restaurant.coverUrl,
    rating: restaurant.rating.toString(),
    minOrderAmount: restaurant.minOrderAmount?.toString() ?? null,
    deliveryFee: restaurant.deliveryFee?.toString() ?? null,
    place: restaurant.place,
    openingHours: restaurant.openingHours,
    galleryImages: restaurant.galleryImages,
  }
}

export async function verifyRestaurantOwnership(userId: string, restaurantId: string) {
  const restaurant = await prisma.restaurant.findFirst({
    where: { id: restaurantId, ownerId: userId },
  })
  if (!restaurant) {
    throw new NotFoundError('Restaurant not found', 'You do not own this restaurant')
  }
  return restaurant
}

export async function getMyRestaurants(userId: string): Promise<MyRestaurantResponse[]> {
  const restaurants = await prisma.restaurant.findMany({
    where: { ownerId: userId },
    select: restaurantSelect,
    orderBy: { name: 'asc' },
  })

  return restaurants.map(formatRestaurant)
}

export async function createMyRestaurant(userId: string, data: CreateMyRestaurantData): Promise<MyRestaurantResponse> {
  const place = await prisma.place.create({
    data: {
      address: data.address.trim(),
      city: data.city.trim(),
      country: data.country.trim(),
      postalCode: data.postalCode?.trim() || null,
    },
  })

  const restaurant = await prisma.restaurant.create({
    data: {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      phone: data.phone?.trim() || null,
      email: data.email?.trim()?.toLowerCase() || null,
      ownerId: userId,
      placeId: place.id,
      minOrderAmount: data.minOrderAmount ?? null,
      deliveryFee: data.deliveryFee ?? null,
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
    select: restaurantSelect,
  })

  geocodePlaceAsync(place.id, data.address.trim(), data.city.trim(), data.country.trim(), data.postalCode?.trim())

  return formatRestaurant(restaurant)
}

async function geocodePlaceAsync(
  placeId: string,
  address: string,
  city: string,
  country: string,
  postalCode?: string | null
): Promise<void> {
  try {
    const coords = await geocodeAddress(address, city, country, null, postalCode)

    if (coords) {
      await prisma.place.update({
        where: { id: placeId },
        data: {
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      })
      logger.info('Restaurant address geocoded successfully', { placeId })
    }
  } catch (error) {
    logger.error('Failed to geocode restaurant address', { placeId, error })
  }
}

export async function updateMyRestaurant(userId: string, restaurantId: string, data: UpdateMyRestaurantData): Promise<MyRestaurantResponse> {
  const restaurant = await prisma.restaurant.findFirst({
    where: { id: restaurantId, ownerId: userId },
    include: { galleryImages: true },
  })

  if (!restaurant) {
    throw new NotFoundError('Restaurant not found', 'You do not own this restaurant')
  }

  const updateData: Record<string, unknown> = {}

  if (data.name !== undefined) {
    updateData.name = data.name.trim()
  }
  if (data.description !== undefined) {
    updateData.description = data.description?.trim() || null
  }
  if (data.phone !== undefined) {
    updateData.phone = data.phone?.trim() || null
  }
  if (data.email !== undefined) {
    updateData.email = data.email?.trim()?.toLowerCase() || null
  }
  if (data.minOrderAmount !== undefined) {
    updateData.minOrderAmount = data.minOrderAmount
  }
  if (data.deliveryFee !== undefined) {
    updateData.deliveryFee = data.deliveryFee
  }
  if (data.logoUrl !== undefined) {
    if (restaurant.logoUrl && isGCSUrl(restaurant.logoUrl) && data.logoUrl !== restaurant.logoUrl) {
      const oldPath = extractGCSPath(restaurant.logoUrl)
      if (oldPath) deleteFromGCS(oldPath)
    }
    updateData.logoUrl = data.logoUrl?.trim() || null
  }
  if (data.coverUrl !== undefined) {
    if (restaurant.coverUrl && isGCSUrl(restaurant.coverUrl) && data.coverUrl !== restaurant.coverUrl) {
      const oldPath = extractGCSPath(restaurant.coverUrl)
      if (oldPath) deleteFromGCS(oldPath)
    }
    updateData.coverUrl = data.coverUrl?.trim() || null
  }

  // Use transaction for opening hours + gallery images replacement
  const updated = await prisma.$transaction(async (tx) => {
    // Replace opening hours if provided
    if (data.openingHours !== undefined) {
      await tx.openingHours.deleteMany({ where: { restaurantId } })
      if (data.openingHours.length > 0) {
        await tx.openingHours.createMany({
          data: data.openingHours.map((h) => ({
            restaurantId,
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
      // Clean up removed GCS images
      const newUrls = new Set(data.galleryImages.map((img) => img.imageUrl))
      for (const existing of restaurant.galleryImages) {
        if (!newUrls.has(existing.imageUrl) && isGCSUrl(existing.imageUrl)) {
          const oldPath = extractGCSPath(existing.imageUrl)
          if (oldPath) deleteFromGCS(oldPath)
        }
      }
      await tx.restaurantImage.deleteMany({ where: { restaurantId } })
      if (data.galleryImages.length > 0) {
        await tx.restaurantImage.createMany({
          data: data.galleryImages.map((img) => ({
            restaurantId,
            imageUrl: img.imageUrl,
            sortOrder: img.sortOrder,
          })),
        })
      }
    }

    return tx.restaurant.update({
      where: { id: restaurantId },
      data: updateData,
      select: restaurantSelect,
    })
  })

  return formatRestaurant(updated)
}

export async function deleteMyRestaurant(userId: string, restaurantId: string): Promise<void> {
  const restaurant = await prisma.restaurant.findFirst({
    where: { id: restaurantId, ownerId: userId },
  })

  if (!restaurant) {
    throw new NotFoundError('Restaurant not found', 'You do not own this restaurant')
  }

  await prisma.restaurant.delete({
    where: { id: restaurantId },
  })
}
