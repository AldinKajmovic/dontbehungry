import { prisma } from '../../lib/prisma'
import { NotFoundError } from '../../utils/errors'
import { PaginatedResponse } from '../../types'
import { PaginationParams, PlaceFilters, CreatePlaceData, UpdatePlaceData } from '../../validators/admin.validator'

export async function getPlaces(params: PaginationParams, filters: PlaceFilters = {}): Promise<PaginatedResponse<object>> {
  const { page, limit, search, sortBy, sortOrder } = params
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}

  if (search) {
    where.OR = [
      { address: { contains: search, mode: 'insensitive' as const } },
      { city: { contains: search, mode: 'insensitive' as const } },
      { country: { contains: search, mode: 'insensitive' as const } },
    ]
  }

  if (filters.city) {
    where.city = { contains: filters.city, mode: 'insensitive' as const }
  }

  if (filters.state) {
    where.state = { contains: filters.state, mode: 'insensitive' as const }
  }

  if (filters.country) {
    where.country = { contains: filters.country, mode: 'insensitive' as const }
  }

  if (filters.postalCode) {
    where.postalCode = { contains: filters.postalCode, mode: 'insensitive' as const }
  }

  const validSortFields = ['address', 'city', 'state', 'country', 'postalCode']
  const orderBy = sortBy && validSortFields.includes(sortBy)
    ? { [sortBy]: sortOrder || 'asc' }
    : { city: 'asc' as const }

  const [items, total] = await Promise.all([
    prisma.place.findMany({
      where,
      skip,
      take: limit,
      orderBy,
    }),
    prisma.place.count({ where }),
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

export async function getPlaceById(id: string) {
  const place = await prisma.place.findUnique({
    where: { id },
  })

  if (!place) {
    throw new NotFoundError('Place not found', `No place found with ID: ${id}`)
  }

  return place
}

export async function createPlace(data: CreatePlaceData) {
  const place = await prisma.place.create({
    data: {
      address: data.address,
      city: data.city,
      state: data.state || null,
      country: data.country,
      postalCode: data.postalCode || null,
    },
  })

  return place
}

export async function updatePlace(id: string, data: UpdatePlaceData) {
  await getPlaceById(id)

  const place = await prisma.place.update({
    where: { id },
    data: {
      ...(data.address && { address: data.address }),
      ...(data.city && { city: data.city }),
      ...(data.state !== undefined && { state: data.state || null }),
      ...(data.country && { country: data.country }),
      ...(data.postalCode !== undefined && { postalCode: data.postalCode || null }),
    },
  })

  return place
}

export async function deletePlace(id: string) {
  await getPlaceById(id)
  await prisma.place.delete({ where: { id } })
}
