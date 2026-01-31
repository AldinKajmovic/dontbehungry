import { prisma } from '../../lib/prisma'
import { NotFoundError } from '../../utils/errors'
import { PaginatedResponse } from '../../types'
import { PaginationParams, MenuItemFilters, CreateMenuItemData, UpdateMenuItemData } from '../../validators/admin.validator'

export async function getMenuItems(params: PaginationParams, filters: MenuItemFilters = {}): Promise<PaginatedResponse<object>> {
  const { page, limit, search, sortBy, sortOrder } = params
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}

  if (search) {
    where.name = { contains: search, mode: 'insensitive' as const }
  }

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
    if (filters.minPrice !== undefined) (where.price as Record<string, number>).gte = filters.minPrice
    if (filters.maxPrice !== undefined) (where.price as Record<string, number>).lte = filters.maxPrice
  }

  if (filters.minPrepTime !== undefined || filters.maxPrepTime !== undefined) {
    where.preparationTime = {}
    if (filters.minPrepTime !== undefined) (where.preparationTime as Record<string, number>).gte = filters.minPrepTime
    if (filters.maxPrepTime !== undefined) (where.preparationTime as Record<string, number>).lte = filters.maxPrepTime
  }

  const validSortFields = ['name', 'price', 'isAvailable', 'preparationTime']
  const orderBy = sortBy && validSortFields.includes(sortBy)
    ? { [sortBy]: sortOrder || 'asc' }
    : { name: 'asc' as const }

  const [items, total] = await Promise.all([
    prisma.menuItem.findMany({
      where,
      include: {
        restaurant: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
      skip,
      take: limit,
      orderBy,
    }),
    prisma.menuItem.count({ where }),
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

export async function getMenuItemById(id: string) {
  const item = await prisma.menuItem.findUnique({
    where: { id },
    include: {
      restaurant: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
    },
  })

  if (!item) {
    throw new NotFoundError('Menu item not found', `No menu item found with ID: ${id}`)
  }

  return item
}

export async function createMenuItem(data: CreateMenuItemData) {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: data.restaurantId } })
  if (!restaurant) {
    throw new NotFoundError('Restaurant not found', `No restaurant found with ID: ${data.restaurantId}`)
  }

  if (data.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } })
    if (!category) {
      throw new NotFoundError('Category not found', `No category found with ID: ${data.categoryId}`)
    }
  }

  const item = await prisma.menuItem.create({
    data: {
      name: data.name,
      description: data.description || null,
      price: data.price,
      imageUrl: data.imageUrl || null,
      restaurantId: data.restaurantId,
      categoryId: data.categoryId || null,
      isAvailable: data.isAvailable ?? true,
      preparationTime: data.preparationTime || null,
    },
    include: {
      restaurant: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
    },
  })

  return item
}

export async function updateMenuItem(id: string, data: UpdateMenuItemData) {
  await getMenuItemById(id)

  if (data.restaurantId) {
    const restaurant = await prisma.restaurant.findUnique({ where: { id: data.restaurantId } })
    if (!restaurant) {
      throw new NotFoundError('Restaurant not found', `No restaurant found with ID: ${data.restaurantId}`)
    }
  }

  if (data.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } })
    if (!category) {
      throw new NotFoundError('Category not found', `No category found with ID: ${data.categoryId}`)
    }
  }

  const item = await prisma.menuItem.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl || null }),
      ...(data.restaurantId && { restaurantId: data.restaurantId }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId || null }),
      ...(data.isAvailable !== undefined && { isAvailable: data.isAvailable }),
      ...(data.preparationTime !== undefined && { preparationTime: data.preparationTime || null }),
    },
    include: {
      restaurant: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
    },
  })

  return item
}

export async function deleteMenuItem(id: string) {
  await getMenuItemById(id)
  await prisma.menuItem.delete({ where: { id } })
}
