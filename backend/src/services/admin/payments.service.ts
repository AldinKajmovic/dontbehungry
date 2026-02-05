import { prisma } from '../../lib/prisma'
import { NotFoundError } from '../../utils/errors'
import { PaginatedResponse } from '../../types'
import { PaginationParams, UpdatePaymentData } from '../../validators/admin'
import { PaymentStatus } from '@prisma/client'

export async function getPayments(params: PaginationParams): Promise<PaginatedResponse<object>> {
  const { page, limit, search, sortBy, sortOrder } = params
  const skip = (page - 1) * limit

  const where = search
    ? {
        OR: [
          { id: { contains: search, mode: 'insensitive' as const } },
          { orderId: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const validSortFields = ['amount', 'status', 'method']
  const orderBy = sortBy && validSortFields.includes(sortBy)
    ? { [sortBy]: sortOrder || 'asc' }
    : { id: 'desc' as const }

  const [items, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            user: { select: { id: true, email: true } },
            restaurant: { select: { id: true, name: true } },
          },
        },
      },
      skip,
      take: limit,
      orderBy,
    }),
    prisma.payment.count({ where }),
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

export async function getPaymentById(id: string) {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      order: {
        select: {
          id: true,
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          restaurant: { select: { id: true, name: true } },
        },
      },
    },
  })

  if (!payment) {
    throw new NotFoundError('Payment not found', `No payment found with ID: ${id}`)
  }

  return payment
}

export async function updatePayment(id: string, data: UpdatePaymentData) {
  await getPaymentById(id)

  const payment = await prisma.payment.update({
    where: { id },
    data: {
      ...(data.status && { status: data.status as PaymentStatus }),
    },
    include: {
      order: {
        select: {
          id: true,
          user: { select: { id: true, email: true } },
          restaurant: { select: { id: true, name: true } },
        },
      },
    },
  })

  return payment
}
