import { prisma } from '../../lib/prisma'

export async function getStats() {
  const [totalUsers, totalRestaurants, totalOrders, revenueResult] = await Promise.all([
    prisma.user.count(),
    prisma.restaurant.count(),
    prisma.order.count(),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'COMPLETED' },
    }),
  ])

  return {
    totalUsers,
    totalRestaurants,
    totalOrders,
    totalRevenue: revenueResult._sum.amount?.toNumber() || 0,
  }
}
