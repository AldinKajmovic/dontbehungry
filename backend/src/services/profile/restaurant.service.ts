// Restaurant owner CRUD: getMyRestaurants, createMyRestaurant, updateMyRestaurant, deleteMyRestaurant
import { prisma } from '../../lib/prisma'
import { NotFoundError } from '../../utils/errors'
import {
  MyRestaurantResponse,
  CreateMyRestaurantData,
  UpdateMyRestaurantData,
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
    include: {
      place: {
        select: {
          id: true,
          address: true,
          city: true,
          country: true,
        },
      },
    },
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
    },
    select: restaurantSelect,
  })

  return formatRestaurant(restaurant)
}

export async function updateMyRestaurant(userId: string, restaurantId: string, data: UpdateMyRestaurantData): Promise<MyRestaurantResponse> {
  const restaurant = await prisma.restaurant.findFirst({
    where: { id: restaurantId, ownerId: userId },
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
    updateData.logoUrl = data.logoUrl?.trim() || null
  }
  if (data.coverUrl !== undefined) {
    updateData.coverUrl = data.coverUrl?.trim() || null
  }

  const updated = await prisma.restaurant.update({
    where: { id: restaurantId },
    data: updateData,
    select: restaurantSelect,
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
