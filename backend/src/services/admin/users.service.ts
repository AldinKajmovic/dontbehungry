import { prisma } from '../../lib/prisma'
import { NotFoundError, ConflictError } from '../../utils/errors'
import { hashPassword } from '../../utils/password'
import { PaginatedResponse } from '../../types'
import { PaginationParams, UserFilters, CreateUserData, UpdateUserData } from '../../validators/admin.validator'
import { UserRole } from '@prisma/client'

export async function getUsers(params: PaginationParams, filters: UserFilters = {}): Promise<PaginatedResponse<object>> {
  const { page, limit, search, sortBy, sortOrder } = params
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' as const } },
      { firstName: { contains: search, mode: 'insensitive' as const } },
      { lastName: { contains: search, mode: 'insensitive' as const } },
    ]
  }

  if (filters.role) {
    where.role = filters.role
  }

  if (filters.emailVerified !== undefined) {
    where.emailVerified = filters.emailVerified
  }

  const validSortFields = ['email', 'firstName', 'lastName', 'role', 'emailVerified']
  const orderBy = sortBy && validSortFields.includes(sortBy)
    ? { [sortBy]: sortOrder || 'asc' }
    : { email: 'asc' as const }

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        emailVerified: true,
        phoneVerified: true,
        avatarUrl: true,
        authProvider: true,
      },
      skip,
      take: limit,
      orderBy,
    }),
    prisma.user.count({ where }),
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

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      emailVerified: true,
      phoneVerified: true,
      avatarUrl: true,
      authProvider: true,
    },
  })

  if (!user) {
    throw new NotFoundError('User not found', `No user found with ID: ${id}`)
  }

  return user
}

export async function createUser(data: CreateUserData) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  })

  if (existingUser) {
    throw new ConflictError('Email already exists', 'A user with this email already exists')
  }

  const passwordHash = await hashPassword(data.password)

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || null,
      role: (data.role as UserRole) || 'CUSTOMER',
      emailVerified: false,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      emailVerified: true,
      phoneVerified: true,
      avatarUrl: true,
    },
  })

  return user
}

export async function updateUser(id: string, data: UpdateUserData) {
  await getUserById(id)

  if (data.email) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email: data.email.toLowerCase(),
        NOT: { id },
      },
    })

    if (existingUser) {
      throw new ConflictError('Email already exists', 'A user with this email already exists')
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(data.email && { email: data.email.toLowerCase() }),
      ...(data.firstName && { firstName: data.firstName }),
      ...(data.lastName && { lastName: data.lastName }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.role && { role: data.role as UserRole }),
      ...(data.emailVerified !== undefined && { emailVerified: data.emailVerified }),
      ...(data.phoneVerified !== undefined && { phoneVerified: data.phoneVerified }),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      emailVerified: true,
      phoneVerified: true,
      avatarUrl: true,
    },
  })

  return user
}

export async function deleteUser(id: string) {
  await getUserById(id)
  await prisma.user.delete({ where: { id } })
}
