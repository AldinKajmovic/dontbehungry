import { logTestCase } from '../helpers/testLogger'

/**
 * Cart calculation functions extracted from CartProvider.tsx.
 * These are pure calculations that we test independently of React context.
 */
interface CartItem {
  id: string
  menuItemId: string
  name: string
  price: number
  quantity: number
}

interface CartRestaurant {
  id: string
  name: string
  deliveryFee: number
  minOrderAmount: number
}

function calculateItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

function calculateDeliveryFee(restaurant: CartRestaurant | null): number {
  return restaurant?.deliveryFee ?? 0
}

function calculateTax(subtotal: number): number {
  return subtotal * 0.20
}

function calculateMinOrderFee(
  restaurant: CartRestaurant | null,
  subtotal: number
): number {
  return restaurant && subtotal < restaurant.minOrderAmount ? 5 : 0
}

function calculateTotal(
  subtotal: number,
  deliveryFee: number,
  tax: number,
  minOrderFee: number
): number {
  return subtotal + deliveryFee + tax + minOrderFee
}

// Helper to create test items
function createItem(
  price: number,
  quantity: number,
  id = 'item-1'
): CartItem {
  return {
    id,
    menuItemId: `menu-${id}`,
    name: `Item ${id}`,
    price,
    quantity,
  }
}

describe('Cart Calculations', () => {
  describe('calculateItemCount', () => {
    it('should return 0 for empty cart', () => {
      const actual = calculateItemCount([])
      logTestCase('Empty cart item count', {
        input: [],
        expected: 0,
        actual,
      })
      expect(actual).toBe(0)
    })

    it('should count single item', () => {
      const items = [createItem(10, 1)]
      const actual = calculateItemCount(items)
      logTestCase('Single item count', {
        input: [{ price: 10, quantity: 1 }],
        expected: 1,
        actual,
      })
      expect(actual).toBe(1)
    })

    it('should sum quantities across items', () => {
      const items = [
        createItem(10, 2, '1'),
        createItem(15, 3, '2'),
        createItem(5, 1, '3'),
      ]
      const actual = calculateItemCount(items)
      logTestCase('Multiple items count', {
        input: [{ qty: 2 }, { qty: 3 }, { qty: 1 }],
        expected: 6,
        actual,
      })
      expect(actual).toBe(6)
    })

    it('should handle large quantities', () => {
      const items = [createItem(1, 100)]
      const actual = calculateItemCount(items)
      logTestCase('Large quantity', {
        input: [{ qty: 100 }],
        expected: 100,
        actual,
      })
      expect(actual).toBe(100)
    })
  })

  describe('calculateSubtotal', () => {
    it('should return 0 for empty cart', () => {
      const actual = calculateSubtotal([])
      logTestCase('Empty cart subtotal', {
        input: [],
        expected: 0,
        actual,
      })
      expect(actual).toBe(0)
    })

    it('should calculate price * quantity for single item', () => {
      const items = [createItem(10.50, 2)]
      const actual = calculateSubtotal(items)
      logTestCase('Single item subtotal', {
        input: [{ price: 10.50, quantity: 2 }],
        expected: 21.0,
        actual,
      })
      expect(actual).toBe(21.0)
    })

    it('should sum across multiple items', () => {
      const items = [
        createItem(10, 2, '1'), // 20
        createItem(15, 1, '2'), // 15
        createItem(5, 3, '3'),  // 15
      ]
      const actual = calculateSubtotal(items)
      logTestCase('Multiple items subtotal', {
        input: [
          { price: 10, qty: 2 },
          { price: 15, qty: 1 },
          { price: 5, qty: 3 },
        ],
        expected: 50,
        actual,
      })
      expect(actual).toBe(50)
    })

    it('should handle decimal prices accurately', () => {
      const items = [
        createItem(9.99, 1, '1'),
        createItem(4.99, 2, '2'),
      ]
      const actual = calculateSubtotal(items)
      logTestCase('Decimal prices', {
        input: [{ price: 9.99, qty: 1 }, { price: 4.99, qty: 2 }],
        expected: 19.97,
        actual,
      })
      expect(actual).toBeCloseTo(19.97, 2)
    })

    it('should handle zero price items', () => {
      const items = [createItem(0, 5)]
      const actual = calculateSubtotal(items)
      logTestCase('Zero price item', {
        input: [{ price: 0, quantity: 5 }],
        expected: 0,
        actual,
      })
      expect(actual).toBe(0)
    })
  })

  describe('calculateDeliveryFee', () => {
    it('should return 0 when no restaurant', () => {
      const actual = calculateDeliveryFee(null)
      logTestCase('No restaurant delivery fee', {
        input: null,
        expected: 0,
        actual,
      })
      expect(actual).toBe(0)
    })

    it('should return restaurant delivery fee', () => {
      const restaurant: CartRestaurant = {
        id: 'r1',
        name: 'Pizza Place',
        deliveryFee: 3.50,
        minOrderAmount: 10,
      }
      const actual = calculateDeliveryFee(restaurant)
      logTestCase('Restaurant delivery fee', {
        input: { deliveryFee: 3.50 },
        expected: 3.50,
        actual,
      })
      expect(actual).toBe(3.50)
    })

    it('should return 0 when restaurant has 0 delivery fee', () => {
      const restaurant: CartRestaurant = {
        id: 'r1',
        name: 'Free Delivery',
        deliveryFee: 0,
        minOrderAmount: 0,
      }
      const actual = calculateDeliveryFee(restaurant)
      logTestCase('Zero delivery fee', {
        input: { deliveryFee: 0 },
        expected: 0,
        actual,
      })
      expect(actual).toBe(0)
    })
  })

  describe('calculateTax', () => {
    it('should calculate 20% tax', () => {
      const actual = calculateTax(100)
      logTestCase('Tax on 100', {
        input: { subtotal: 100 },
        expected: 20,
        actual,
      })
      expect(actual).toBe(20)
    })

    it('should return 0 tax for 0 subtotal', () => {
      const actual = calculateTax(0)
      logTestCase('Tax on 0', {
        input: { subtotal: 0 },
        expected: 0,
        actual,
      })
      expect(actual).toBe(0)
    })

    it('should handle decimal subtotals', () => {
      const actual = calculateTax(25.50)
      logTestCase('Tax on 25.50', {
        input: { subtotal: 25.50 },
        expected: 5.10,
        actual,
      })
      expect(actual).toBeCloseTo(5.10, 2)
    })

    it('should handle small subtotals', () => {
      const actual = calculateTax(1)
      logTestCase('Tax on 1', {
        input: { subtotal: 1 },
        expected: 0.20,
        actual,
      })
      expect(actual).toBeCloseTo(0.20, 2)
    })

    it('should handle large subtotals', () => {
      const actual = calculateTax(1000)
      logTestCase('Tax on 1000', {
        input: { subtotal: 1000 },
        expected: 200,
        actual,
      })
      expect(actual).toBe(200)
    })
  })

  describe('calculateMinOrderFee', () => {
    const restaurant: CartRestaurant = {
      id: 'r1',
      name: 'Test',
      deliveryFee: 3,
      minOrderAmount: 15,
    }

    it('should return 5 when subtotal is below min order amount', () => {
      const actual = calculateMinOrderFee(restaurant, 10)
      logTestCase('Below min order', {
        input: { subtotal: 10, minOrderAmount: 15 },
        expected: 5,
        actual,
      })
      expect(actual).toBe(5)
    })

    it('should return 0 when subtotal equals min order amount', () => {
      const actual = calculateMinOrderFee(restaurant, 15)
      logTestCase('At min order', {
        input: { subtotal: 15, minOrderAmount: 15 },
        expected: 0,
        actual,
      })
      expect(actual).toBe(0)
    })

    it('should return 0 when subtotal exceeds min order amount', () => {
      const actual = calculateMinOrderFee(restaurant, 20)
      logTestCase('Above min order', {
        input: { subtotal: 20, minOrderAmount: 15 },
        expected: 0,
        actual,
      })
      expect(actual).toBe(0)
    })

    it('should return 0 when no restaurant', () => {
      const actual = calculateMinOrderFee(null, 5)
      logTestCase('No restaurant', {
        input: { restaurant: null, subtotal: 5 },
        expected: 0,
        actual,
      })
      expect(actual).toBe(0)
    })

    it('should return 5 when subtotal is 0 and restaurant has min order', () => {
      const actual = calculateMinOrderFee(restaurant, 0)
      logTestCase('Zero subtotal with min order', {
        input: { subtotal: 0, minOrderAmount: 15 },
        expected: 5,
        actual,
      })
      expect(actual).toBe(5)
    })

    it('should return 0 when min order amount is 0', () => {
      const noMinRestaurant: CartRestaurant = {
        id: 'r2',
        name: 'No Min',
        deliveryFee: 3,
        minOrderAmount: 0,
      }
      const actual = calculateMinOrderFee(noMinRestaurant, 5)
      logTestCase('Min order = 0', {
        input: { subtotal: 5, minOrderAmount: 0 },
        expected: 0,
        actual,
      })
      expect(actual).toBe(0)
    })
  })

  describe('calculateTotal', () => {
    it('should sum all components', () => {
      const subtotal = 50
      const deliveryFee = 3
      const tax = 10
      const minOrderFee = 0
      const actual = calculateTotal(subtotal, deliveryFee, tax, minOrderFee)
      logTestCase('Total calculation', {
        input: { subtotal, deliveryFee, tax, minOrderFee },
        expected: 63,
        actual,
      })
      expect(actual).toBe(63)
    })

    it('should include min order fee', () => {
      const actual = calculateTotal(10, 3, 2, 5)
      logTestCase('Total with min order fee', {
        input: { subtotal: 10, deliveryFee: 3, tax: 2, minOrderFee: 5 },
        expected: 20,
        actual,
      })
      expect(actual).toBe(20)
    })

    it('should return 0 when all components are 0', () => {
      const actual = calculateTotal(0, 0, 0, 0)
      logTestCase('All zeros total', {
        input: { subtotal: 0, deliveryFee: 0, tax: 0, minOrderFee: 0 },
        expected: 0,
        actual,
      })
      expect(actual).toBe(0)
    })

    it('should handle decimal totals', () => {
      const actual = calculateTotal(25.50, 3.50, 5.10, 0)
      logTestCase('Decimal total', {
        input: { subtotal: 25.50, deliveryFee: 3.50, tax: 5.10, minOrderFee: 0 },
        expected: 34.10,
        actual,
      })
      expect(actual).toBeCloseTo(34.10, 2)
    })
  })

  describe('Full cart calculation scenario', () => {
    it('should calculate a complete order correctly', () => {
      const items = [
        createItem(12.99, 2, '1'), // 25.98
        createItem(8.50, 1, '2'),  // 8.50
        createItem(3.99, 3, '3'),  // 11.97
      ]
      const restaurant: CartRestaurant = {
        id: 'r1',
        name: 'Test Restaurant',
        deliveryFee: 3.00,
        minOrderAmount: 15,
      }

      const itemCount = calculateItemCount(items)
      const subtotal = calculateSubtotal(items)
      const deliveryFee = calculateDeliveryFee(restaurant)
      const tax = calculateTax(subtotal)
      const minOrderFee = calculateMinOrderFee(restaurant, subtotal)
      const total = calculateTotal(subtotal, deliveryFee, tax, minOrderFee)

      logTestCase('Full order calculation', {
        input: {
          items: items.map((i) => ({ price: i.price, qty: i.quantity })),
          restaurant: { deliveryFee: 3, minOrderAmount: 15 },
        },
        expected: {
          itemCount: 6,
          subtotal: 46.45,
          deliveryFee: 3,
          tax: 9.29,
          minOrderFee: 0,
          total: 58.74,
        },
        actual: { itemCount, subtotal, deliveryFee, tax, minOrderFee, total },
      })

      expect(itemCount).toBe(6)
      expect(subtotal).toBeCloseTo(46.45, 2)
      expect(deliveryFee).toBe(3)
      expect(tax).toBeCloseTo(9.29, 2)
      expect(minOrderFee).toBe(0) // subtotal > minOrderAmount
      expect(total).toBeCloseTo(58.74, 2)
    })

    it('should apply min order fee for small order', () => {
      const items = [createItem(5.00, 1)]
      const restaurant: CartRestaurant = {
        id: 'r1',
        name: 'Expensive Min',
        deliveryFee: 2.00,
        minOrderAmount: 20,
      }

      const subtotal = calculateSubtotal(items)
      const deliveryFee = calculateDeliveryFee(restaurant)
      const tax = calculateTax(subtotal)
      const minOrderFee = calculateMinOrderFee(restaurant, subtotal)
      const total = calculateTotal(subtotal, deliveryFee, tax, minOrderFee)

      logTestCase('Small order with min fee', {
        input: { item: { price: 5, qty: 1 }, minOrder: 20 },
        expected: {
          subtotal: 5,
          deliveryFee: 2,
          tax: 1,
          minOrderFee: 5,
          total: 13,
        },
        actual: { subtotal, deliveryFee, tax, minOrderFee, total },
      })

      expect(subtotal).toBe(5)
      expect(tax).toBe(1)
      expect(minOrderFee).toBe(5)
      expect(total).toBe(13)
    })
  })
})
