import { prisma } from '../lib/prisma'
import { NotFoundError, BadRequestError } from '../utils/errors'
import { geocodeAddress as geocode } from '../utils/geocoding'
import { logger } from '../utils/logger'

export interface AdressInput {
  address: string
  city: string
  state?: string
  country: string
  postalCode?: string
  notes?: string
  isDefault?: boolean
  latitude?: number
  longitude?: number
}

export interface AddressResponse {
  id: string
  address: string
  city: string
  state: string | null
  country: string
  postalCode: string | null
  notes: string | null
  isDefault: boolean
  latitude: number | null
  longitude: number | null
}

export async function getUserAddresses(userId: string): Promise<AddressResponse[]> {
  const userAddresses = await prisma.userAddress.findMany({
    where: { userId },
    include: { place: true },
    orderBy: [{ isDefault: 'desc' }, { id: 'asc' }],
  })

  return userAddresses.map((ua) => ({
    id: ua.id,
    address: ua.place.address,
    city: ua.place.city,
    state: ua.place.state,
    country: ua.place.country,
    postalCode: ua.place.postalCode,
    notes: ua.notes,
    isDefault: ua.isDefault,
    latitude: ua.place.latitude ? Number(ua.place.latitude) : null,
    longitude: ua.place.longitude ? Number(ua.place.longitude) : null,
  }))
}

export async function addAddress(userId: string, data: AdressInput): Promise<AddressResponse> {
  const { address, city, state, country, postalCode, notes, isDefault, latitude, longitude } = data

  const existingAddresses = await prisma.userAddress.count({ where: { userId } })
  const shouldBeDefault = isDefault || existingAddresses === 0

  // If making this default, unset other defaults
  if (shouldBeDefault) {
    await prisma.userAddress.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    })
  }

  const userAddress = await prisma.$transaction(async (tx) => {
    const place = await tx.place.create({
      data: {
        address,
        city,
        state: state || null,
        country,
        postalCode: postalCode || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
      },
    })

    return tx.userAddress.create({
      data: {
        userId,
        placeId: place.id,
        notes: notes || null,
        isDefault: shouldBeDefault,
      },
      include: { place: true },
    })
  })

  if (!latitude || !longitude) {
    geocodeAddressAsync(userAddress.placeId, address, city, country, state, postalCode)
  }

  return {
    id: userAddress.id,
    address: userAddress.place.address,
    city: userAddress.place.city,
    state: userAddress.place.state,
    country: userAddress.place.country,
    postalCode: userAddress.place.postalCode,
    notes: userAddress.notes,
    isDefault: userAddress.isDefault,
    latitude: userAddress.place.latitude ? Number(userAddress.place.latitude) : null,
    longitude: userAddress.place.longitude ? Number(userAddress.place.longitude) : null,
  }
}

export async function updateAddress(userId: string, addressId: string, data: Partial<AdressInput>): Promise<AddressResponse> {
  const userAddress = await prisma.userAddress.findFirst({
    where: { id: addressId, userId },
    include: { place: true },
  })

  if (!userAddress) {
    throw new NotFoundError('Address not found', 'This address does not exist')
  }

  if (data.isDefault) {
    await prisma.userAddress.updateMany({
      where: { userId, isDefault: true, id: { not: addressId } },
      data: { isDefault: false },
    })
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (data.address || data.city || data.state !== undefined || data.country || data.postalCode !== undefined) {
      await tx.place.update({
        where: { id: userAddress.placeId },
        data: {
          address: data.address ?? userAddress.place.address,
          city: data.city ?? userAddress.place.city,
          state: data.state !== undefined ? (data.state || null) : userAddress.place.state,
          country: data.country ?? userAddress.place.country,
          postalCode: data.postalCode !== undefined ? (data.postalCode || null) : userAddress.place.postalCode,
        },
      })
    }

    return tx.userAddress.update({
      where: { id: addressId },
      data: {
        notes: data.notes !== undefined ? (data.notes || null) : userAddress.notes,
        isDefault: data.isDefault ?? userAddress.isDefault,
      },
      include: { place: true },
    })
  })

  return {
    id: updated.id,
    address: updated.place.address,
    city: updated.place.city,
    state: updated.place.state,
    country: updated.place.country,
    postalCode: updated.place.postalCode,
    notes: updated.notes,
    isDefault: updated.isDefault,
    latitude: updated.place.latitude ? Number(updated.place.latitude) : null,
    longitude: updated.place.longitude ? Number(updated.place.longitude) : null,
  }
}

export async function deleteAddress(userId: string, addressId: string): Promise<void> {
  const userAddress = await prisma.userAddress.findFirst({
    where: { id: addressId, userId },
  })

  if (!userAddress) {
    throw new NotFoundError('Address not found', 'This address does not exist')
  }

  const wasDefault = userAddress.isDefault

  await prisma.$transaction(async (tx) => {
    const placeId = userAddress.placeId
    await tx.userAddress.delete({ where: { id: addressId } })

    // One place can be shared by many addresses (building, restaurant), diff labels, multiple users etc.
    const otherReferences = await tx.userAddress.count({ where: { placeId } })
    const restaurantReference = await tx.restaurant.count({ where: { placeId } })

    if (otherReferences === 0 && restaurantReference === 0) {
      await tx.place.delete({ where: { id: placeId } })
    }
    
    if (wasDefault) {
      const firstRemaining = await tx.userAddress.findFirst({
        where: { userId },
        orderBy: { id: 'asc' },
      })

      if (firstRemaining) {
        await tx.userAddress.update({
          where: { id: firstRemaining.id },
          data: { isDefault: true },
        })
      }
    }
  })
}

export async function setDefaultAddress(userId: string, addressId: string): Promise<AddressResponse> {
  const userAddress = await prisma.userAddress.findFirst({
    where: { id: addressId, userId },
    include: { place: true },
  })

  if (!userAddress) {
    throw new NotFoundError('Address not found', 'This address does not exist')
  }

  await prisma.$transaction([
    prisma.userAddress.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    }),
    prisma.userAddress.update({
      where: { id: addressId },
      data: { isDefault: true },
    }),
  ])

  return {
    id: userAddress.id,
    address: userAddress.place.address,
    city: userAddress.place.city,
    state: userAddress.place.state,
    country: userAddress.place.country,
    postalCode: userAddress.place.postalCode,
    notes: userAddress.notes,
    isDefault: true,
    latitude: userAddress.place.latitude ? Number(userAddress.place.latitude) : null,
    longitude: userAddress.place.longitude ? Number(userAddress.place.longitude) : null,
  }
}
async function geocodeAddressAsync(
  placeId: string,
  address: string,
  city: string,
  country: string,
  state?: string | null,
  postalCode?: string | null
): Promise<void> {
  try {
    const coords = await geocode(address, city, country, state, postalCode)

    if (coords) {
      await prisma.place.update({
        where: { id: placeId },
        data: {
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      })
      logger.info('Address geocoded successfully', { placeId })
    }
  } catch (error) {
    logger.error('Failed to geocode address', { placeId, error })
  }
}
