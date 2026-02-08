import { prisma } from '../../lib/prisma'
import { NotFoundError, ConflictError } from '../../utils/errors'
import { deleteFromGCS, extractGCSPath, isGCSUrl } from '../../lib/gcs'
import { PaginatedResponse } from '../../types'
import { PaginationParams, CreateCategoryData, UpdateCategoryData } from '../../validators/admin'

export async function getCategories(params: PaginationParams): Promise<PaginatedResponse<object>> {
  const { page, limit, search, sortBy, sortOrder } = params
  const skip = (page - 1) * limit

  const where = search
    ? { name: { contains: search, mode: 'insensitive' as const } }
    : {}

  const validSortFields = ['name', 'description']
  const orderBy = sortBy && validSortFields.includes(sortBy)
    ? { [sortBy]: sortOrder || 'asc' }
    : { name: 'asc' as const }

  const [items, total] = await Promise.all([
    prisma.category.findMany({
      where,
      skip,
      take: limit,
      orderBy,
    }),
    prisma.category.count({ where }),
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

export async function getCategoryById(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
  })

  if (!category) {
    throw new NotFoundError('Category not found', `No category found with ID: ${id}`)
  }

  return category
}

export async function createCategory(data: CreateCategoryData) {
  const existing = await prisma.category.findUnique({
    where: { name: data.name },
  })

  if (existing) {
    throw new ConflictError('Category exists', 'A category with this name already exists')
  }

  const category = await prisma.category.create({
    data: {
      name: data.name,
      description: data.description || null,
      iconUrl: data.iconUrl || null,
    },
  })

  return category
}

export async function updateCategory(id: string, data: UpdateCategoryData) {
  const existing = await getCategoryById(id)

  // Clean up old icon from GCS when replaced
  if (data.iconUrl !== undefined && existing.iconUrl && isGCSUrl(existing.iconUrl) && data.iconUrl !== existing.iconUrl) {
    const oldPath = extractGCSPath(existing.iconUrl)
    if (oldPath) deleteFromGCS(oldPath)
  }

  if (data.name) {
    const existing = await prisma.category.findFirst({
      where: {
        name: data.name,
        NOT: { id },
      },
    })

    if (existing) {
      throw new ConflictError('Category exists', 'A category with this name already exists')
    }
  }

  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.iconUrl !== undefined && { iconUrl: data.iconUrl || null }),
    },
  })

  return category
}

export async function deleteCategory(id: string) {
  await getCategoryById(id)
  await prisma.category.delete({ where: { id } })
}
