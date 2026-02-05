// Menu item CRUD: getMyMenuItems, createMyMenuItem, updateMyMenuItem, deleteMyMenuItem, getCategories
import { prisma } from '../../lib/prisma'
import { NotFoundError } from '../../utils/errors'
import { verifyRestaurantOwnership } from './restaurant.service'
import {
  MyMenuItemResponse,
  CreateMyMenuItemData,
  UpdateMyMenuItemData,
} from './types'

const menuItemSelect = {
  id: true,
  name: true,
  description: true,
  price: true,
  imageUrl: true,
  isAvailable: true,
  preparationTime: true,
  category: {
    select: { id: true, name: true },
  },
}

function formatMenuItem(item: {
  id: string
  name: string
  description: string | null
  price: { toString(): string }
  imageUrl: string | null
  isAvailable: boolean
  preparationTime: number | null
  category: { id: string; name: string } | null
}): MyMenuItemResponse {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price.toString(),
    imageUrl: item.imageUrl,
    isAvailable: item.isAvailable,
    preparationTime: item.preparationTime,
    category: item.category,
  }
}

export async function getMyMenuItems(userId: string, restaurantId: string): Promise<MyMenuItemResponse[]> {
  await verifyRestaurantOwnership(userId, restaurantId)

  const items = await prisma.menuItem.findMany({
    where: { restaurantId },
    select: menuItemSelect,
    orderBy: { name: 'asc' },
  })

  return items.map(formatMenuItem)
}

export async function createMyMenuItem(userId: string, restaurantId: string, data: CreateMyMenuItemData): Promise<MyMenuItemResponse> {
  await verifyRestaurantOwnership(userId, restaurantId)

  if (data.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } })
    if (!category) {
      throw new NotFoundError('Category not found', `No category found with ID: ${data.categoryId}`)
    }
  }

  const item = await prisma.menuItem.create({
    data: {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      price: data.price,
      imageUrl: data.imageUrl?.trim() || null,
      restaurantId,
      categoryId: data.categoryId || null,
      isAvailable: data.isAvailable ?? true,
      preparationTime: data.preparationTime ?? null,
    },
    select: menuItemSelect,
  })

  return formatMenuItem(item)
}

export async function updateMyMenuItem(userId: string, restaurantId: string, itemId: string, data: UpdateMyMenuItemData): Promise<MyMenuItemResponse> {
  await verifyRestaurantOwnership(userId, restaurantId)

  const existingItem = await prisma.menuItem.findFirst({
    where: { id: itemId, restaurantId },
  })
  if (!existingItem) {
    throw new NotFoundError('Menu item not found', 'This menu item does not exist in your restaurant')
  }

  if (data.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } })
    if (!category) {
      throw new NotFoundError('Category not found', `No category found with ID: ${data.categoryId}`)
    }
  }

  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name.trim()
  if (data.description !== undefined) updateData.description = data.description?.trim() || null
  if (data.price !== undefined) updateData.price = data.price
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl?.trim() || null
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId || null
  if (data.isAvailable !== undefined) updateData.isAvailable = data.isAvailable
  if (data.preparationTime !== undefined) updateData.preparationTime = data.preparationTime

  const item = await prisma.menuItem.update({
    where: { id: itemId },
    data: updateData,
    select: menuItemSelect,
  })

  return formatMenuItem(item)
}

export async function deleteMyMenuItem(userId: string, restaurantId: string, itemId: string): Promise<void> {
  await verifyRestaurantOwnership(userId, restaurantId)

  const existingItem = await prisma.menuItem.findFirst({
    where: { id: itemId, restaurantId },
  })
  if (!existingItem) {
    throw new NotFoundError('Menu item not found', 'This menu item does not exist in your restaurant')
  }

  await prisma.menuItem.delete({ where: { id: itemId } })
}

export async function getCategories(): Promise<{ id: string; name: string }[]> {
  return prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
}
