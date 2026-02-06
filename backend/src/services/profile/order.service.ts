// Order creation: createOrder
import { prisma } from '../../lib/prisma'
import { BadRequestError, NotFoundError } from '../../utils/errors'
import { notifyNewOrder } from '../notification.service'
import { broadcastOrderToNearbyDrivers } from './orderBroadcast.service'
import { logger } from '../../utils/logger'
import { CreateOrderData, CreatedOrderResponse } from './types'

export async function createOrder(userId: string, data: CreateOrderData): Promise<CreatedOrderResponse> {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: data.restaurantId },
    select: {
      id: true,
      name: true,
      deliveryFee: true,
      minOrderAmount: true,
      ownerId: true,
    },
  })

  if (!restaurant) {
    throw new NotFoundError('Restaurant not found', 'The specified restaurant does not exist')
  }

  const userAddress = await prisma.userAddress.findFirst({
    where: {
      id: data.deliveryAddressId,
      userId,
    },
    include: {
      place: true,
    },
  })

  if (!userAddress) {
    throw new NotFoundError('Address not found', 'The specified delivery address does not exist')
  }

  const menuItemIds = data.items.map((item) => item.menuItemId)
  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: menuItemIds },
      restaurantId: data.restaurantId,
      isAvailable: true,
    },
  })

  if (menuItems.length !== menuItemIds.length) {
    throw new BadRequestError('Invalid items', 'Some menu items are not available or do not belong to this restaurant')
  }

  const menuItemMap = new Map(menuItems.map((item) => [item.id, item]))

  let subtotal = 0
  const orderItemsData = data.items.map((item) => {
    const menuItem = menuItemMap.get(item.menuItemId)!
    const unitPrice = Number(menuItem.price)
    const totalPrice = unitPrice * item.quantity
    subtotal += totalPrice

    return {
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      unitPrice,
      totalPrice,
      notes: item.notes || null,
    }
  })

  const minOrderAmount = restaurant.minOrderAmount ? Number(restaurant.minOrderAmount) : 0
  const minOrderFee = subtotal < minOrderAmount ? 5 : 0

  const deliveryFee = restaurant.deliveryFee ? Number(restaurant.deliveryFee) : 0
  const tax = subtotal * 0.20 // 20% tax
  const totalAmount = subtotal + deliveryFee + tax + minOrderFee

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        userId,
        restaurantId: data.restaurantId,
        deliveryPlaceId: userAddress.placeId,
        status: 'PENDING',
        subtotal,
        deliveryFee,
        tax,
        totalAmount,
        notes: data.notes || null,
      },
    })

    await tx.orderItem.createMany({
      data: orderItemsData.map((item) => ({
        orderId: newOrder.id,
        ...item,
      })),
    })

    await tx.payment.create({
      data: {
        orderId: newOrder.id,
        amount: totalAmount,
        method: data.paymentMethod,
        status: 'PENDING',
      },
    })

    return newOrder
  })

  const completeOrder = await prisma.order.findUnique({
    where: { id: order.id },
    select: {
      id: true,
      status: true,
      totalAmount: true,
      createdAt: true,
      restaurant: {
        select: {
          id: true,
          name: true,
        },
      },
      deliveryPlace: {
        select: {
          address: true,
          city: true,
        },
      },
      orderItems: {
        select: {
          quantity: true,
          unitPrice: true,
          menuItem: {
            select: {
              name: true,
            },
          },
        },
      },
      payment: {
        select: {
          status: true,
          method: true,
        },
      },
    },
  })

  if (!completeOrder) {
    throw new Error('Failed to fetch created order')
  }

  notifyNewOrder(
    restaurant.ownerId,
    completeOrder.id,
    restaurant.name,
    completeOrder.totalAmount.toString()
  )

  broadcastOrderToNearbyDrivers(completeOrder.id).catch((err) => {
    logger.error('Failed to broadcast order to drivers', err, { orderId: completeOrder.id })
  })

  return {
    id: completeOrder.id,
    status: completeOrder.status,
    totalAmount: completeOrder.totalAmount.toString(),
    createdAt: completeOrder.createdAt.toISOString(),
    restaurant: completeOrder.restaurant,
    deliveryPlace: completeOrder.deliveryPlace,
    orderItems: completeOrder.orderItems.map((item) => ({
      name: item.menuItem.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toString(),
    })),
    payment: completeOrder.payment!,
  }
}
