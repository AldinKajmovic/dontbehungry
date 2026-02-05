import { prisma } from '../../lib/prisma'
import { NotFoundError, ConflictError } from '../../utils/errors'
import { PaginatedResponse } from '../../types'
import { PaginationParams, ReviewFilters, CreateReviewData, UpdateReviewData } from '../../validators/admin'

export async function getReviews(params: PaginationParams, filters: ReviewFilters = {}): Promise<PaginatedResponse<object>> {
  const { page, limit, search, sortBy, sortOrder } = params
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' as const } },
      { content: { contains: search, mode: 'insensitive' as const } },
    ]
  }

  if (filters.rating) {
    where.rating = filters.rating
  }

  if (filters.restaurantId) {
    where.restaurantId = filters.restaurantId
  }

  const validSortFields = ['rating', 'title']
  const orderBy = sortBy && validSortFields.includes(sortBy)
    ? { [sortBy]: sortOrder || 'asc' }
    : { id: 'desc' as const }

  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        restaurant: { select: { id: true, name: true } },
      },
      skip,
      take: limit,
      orderBy,
    }),
    prisma.review.count({ where }),
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

export async function getReviewById(id: string) {
  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      restaurant: { select: { id: true, name: true } },
    },
  })

  if (!review) {
    throw new NotFoundError('Review not found', `No review found with ID: ${id}`)
  }

  return review
}

export async function createReview(data: CreateReviewData) {
  const user = await prisma.user.findUnique({ where: { id: data.userId } })
  if (!user) {
    throw new NotFoundError('User not found', `No user found with ID: ${data.userId}`)
  }

  const restaurant = await prisma.restaurant.findUnique({ where: { id: data.restaurantId } })
  if (!restaurant) {
    throw new NotFoundError('Restaurant not found', `No restaurant found with ID: ${data.restaurantId}`)
  }

  const existing = await prisma.review.findUnique({
    where: {
      userId_restaurantId: {
        userId: data.userId,
        restaurantId: data.restaurantId,
      },
    },
  })

  if (existing) {
    throw new ConflictError('Review exists', 'User has already reviewed this restaurant')
  }

  const review = await prisma.review.create({
    data: {
      userId: data.userId,
      restaurantId: data.restaurantId,
      rating: data.rating,
      title: data.title || null,
      content: data.content || null,
    },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      restaurant: { select: { id: true, name: true } },
    },
  })

  return review
}

export async function updateReview(id: string, data: UpdateReviewData) {
  await getReviewById(id)

  const review = await prisma.review.update({
    where: { id },
    data: {
      ...(data.rating !== undefined && { rating: data.rating }),
      ...(data.title !== undefined && { title: data.title || null }),
      ...(data.content !== undefined && { content: data.content || null }),
    },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      restaurant: { select: { id: true, name: true } },
    },
  })

  return review
}

export async function deleteReview(id: string) {
  await getReviewById(id)
  await prisma.review.delete({ where: { id } })
}
