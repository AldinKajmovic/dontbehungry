import { logTestCase } from '../helpers/testLogger'
import {
  isValidOrderStatus,
  validateStatusTransition,
  getNextValidStatuses,
} from '../../utils/orderStatus'
import { BadRequestError } from '../../utils/errors'

describe('Order Status State Machine', () => {
  describe('isValidOrderStatus', () => {
    const validStatuses = [
      'PENDING',
      'CONFIRMED',
      'PREPARING',
      'READY_FOR_PICKUP',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
    ]

    it.each(validStatuses)('should return true for valid status: %s', (status) => {
      const actual = isValidOrderStatus(status)
      logTestCase(`isValidOrderStatus("${status}")`, {
        input: status,
        expected: true,
        actual,
      })
      expect(actual).toBe(true)
    })

    const invalidStatuses = ['UNKNOWN', '', 'pending', 'Pending', 'SHIPPED', 'REFUNDED', 'IN_PROGRESS']

    it.each(invalidStatuses)('should return false for invalid status: %s', (status) => {
      const actual = isValidOrderStatus(status)
      logTestCase(`isValidOrderStatus("${status}")`, {
        input: status,
        expected: false,
        actual,
      })
      expect(actual).toBe(false)
    })
  })

  describe('validateStatusTransition — valid transitions', () => {
    const validTransitions: [string, string][] = [
      ['PENDING', 'CONFIRMED'],
      ['PENDING', 'CANCELLED'],
      ['CONFIRMED', 'PREPARING'],
      ['CONFIRMED', 'CANCELLED'],
      ['PREPARING', 'READY_FOR_PICKUP'],
      ['PREPARING', 'CANCELLED'],
      ['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'],
      ['READY_FOR_PICKUP', 'CANCELLED'],
      ['OUT_FOR_DELIVERY', 'DELIVERED'],
      ['OUT_FOR_DELIVERY', 'CANCELLED'],
    ]

    it.each(validTransitions)(
      'should allow transition from %s to %s',
      (from, to) => {
        const input = { from, to }
        expect(() => validateStatusTransition(from, to)).not.toThrow()
        logTestCase(`validateStatusTransition(${from} → ${to})`, {
          input,
          expected: 'no error',
          actual: 'no error',
        })
      }
    )
  })

  describe('validateStatusTransition — same status (no-op)', () => {
    it('should allow transitioning to the same status', () => {
      const input = { from: 'PENDING', to: 'PENDING' }
      expect(() => validateStatusTransition('PENDING', 'PENDING')).not.toThrow()
      logTestCase('Same status transition', {
        input,
        expected: 'no error',
        actual: 'no error',
      })
    })
  })

  describe('validateStatusTransition — invalid transitions', () => {
    const invalidTransitions: [string, string][] = [
      ['PENDING', 'PREPARING'],
      ['PENDING', 'DELIVERED'],
      ['CONFIRMED', 'DELIVERED'],
      ['CONFIRMED', 'OUT_FOR_DELIVERY'],
      ['PREPARING', 'CONFIRMED'],
      ['PREPARING', 'DELIVERED'],
      ['READY_FOR_PICKUP', 'PREPARING'],
      ['OUT_FOR_DELIVERY', 'PREPARING'],
      ['OUT_FOR_DELIVERY', 'CONFIRMED'],
    ]

    it.each(invalidTransitions)(
      'should reject transition from %s to %s',
      (from, to) => {
        const input = { from, to }
        try {
          validateStatusTransition(from, to)
          fail('Expected BadRequestError to be thrown')
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestError)
          logTestCase(`validateStatusTransition(${from} → ${to})`, {
            input,
            expected: 'BadRequestError',
            actual: (error as BadRequestError).error,
          })
        }
      }
    )
  })

  describe('validateStatusTransition — terminal states', () => {
    it('should reject transition from DELIVERED to any state', () => {
      const targets = ['PENDING', 'CONFIRMED', 'PREPARING', 'CANCELLED']
      for (const to of targets) {
        try {
          validateStatusTransition('DELIVERED', to)
          fail('Expected error')
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestError)
          logTestCase(`DELIVERED → ${to}`, {
            input: { from: 'DELIVERED', to },
            expected: 'BadRequestError',
            actual: (error as BadRequestError).error,
          })
        }
      }
    })

    it('should reject transition from CANCELLED to any state', () => {
      const targets = ['PENDING', 'CONFIRMED', 'PREPARING', 'DELIVERED']
      for (const to of targets) {
        try {
          validateStatusTransition('CANCELLED', to)
          fail('Expected error')
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestError)
          logTestCase(`CANCELLED → ${to}`, {
            input: { from: 'CANCELLED', to },
            expected: 'BadRequestError',
            actual: (error as BadRequestError).error,
          })
        }
      }
    })
  })

  describe('validateStatusTransition — admin override', () => {
    it('should allow admin to skip intermediate statuses', () => {
      const input = { from: 'PENDING', to: 'READY_FOR_PICKUP', admin: true }
      expect(() =>
        validateStatusTransition('PENDING', 'READY_FOR_PICKUP', true)
      ).not.toThrow()
      logTestCase('Admin override: PENDING → READY_FOR_PICKUP', {
        input,
        expected: 'no error',
        actual: 'no error',
      })
    })

    it('should block admin from changing DELIVERED status', () => {
      const input = { from: 'DELIVERED', to: 'CANCELLED', admin: true }
      try {
        validateStatusTransition('DELIVERED', 'CANCELLED', true)
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Admin override blocked: DELIVERED → CANCELLED', {
          input,
          expected: 'BadRequestError',
          actual: (error as BadRequestError).details,
        })
      }
    })

    it('should block admin from changing CANCELLED status', () => {
      const input = { from: 'CANCELLED', to: 'PENDING', admin: true }
      try {
        validateStatusTransition('CANCELLED', 'PENDING', true)
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Admin override blocked: CANCELLED → PENDING', {
          input,
          expected: 'BadRequestError',
          actual: (error as BadRequestError).details,
        })
      }
    })
  })

  describe('validateStatusTransition — invalid status strings', () => {
    it('should throw for invalid current status', () => {
      try {
        validateStatusTransition('FAKE', 'CONFIRMED')
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Invalid current status', {
          input: { from: 'FAKE', to: 'CONFIRMED' },
          expected: 'BadRequestError: Invalid current status',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should throw for invalid new status', () => {
      try {
        validateStatusTransition('PENDING', 'FAKE')
        fail('Expected error')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('Invalid new status', {
          input: { from: 'PENDING', to: 'FAKE' },
          expected: 'BadRequestError: Invalid status',
          actual: (error as BadRequestError).error,
        })
      }
    })
  })

  describe('getNextValidStatuses', () => {
    it('should return [CONFIRMED, CANCELLED] for PENDING', () => {
      const actual = getNextValidStatuses('PENDING')
      logTestCase('getNextValidStatuses("PENDING")', {
        input: 'PENDING',
        expected: ['CONFIRMED', 'CANCELLED'],
        actual,
      })
      expect(actual).toEqual(['CONFIRMED', 'CANCELLED'])
    })

    it('should return [PREPARING, CANCELLED] for CONFIRMED', () => {
      const actual = getNextValidStatuses('CONFIRMED')
      logTestCase('getNextValidStatuses("CONFIRMED")', {
        input: 'CONFIRMED',
        expected: ['PREPARING', 'CANCELLED'],
        actual,
      })
      expect(actual).toEqual(['PREPARING', 'CANCELLED'])
    })

    it('should return [] for DELIVERED (terminal)', () => {
      const actual = getNextValidStatuses('DELIVERED')
      logTestCase('getNextValidStatuses("DELIVERED")', {
        input: 'DELIVERED',
        expected: [],
        actual,
      })
      expect(actual).toEqual([])
    })

    it('should return [] for CANCELLED (terminal)', () => {
      const actual = getNextValidStatuses('CANCELLED')
      logTestCase('getNextValidStatuses("CANCELLED")', {
        input: 'CANCELLED',
        expected: [],
        actual,
      })
      expect(actual).toEqual([])
    })

    it('should return [] for an unknown status', () => {
      const actual = getNextValidStatuses('INVALID')
      logTestCase('getNextValidStatuses("INVALID")', {
        input: 'INVALID',
        expected: [],
        actual,
      })
      expect(actual).toEqual([])
    })

    it('should return [OUT_FOR_DELIVERY, CANCELLED] for READY_FOR_PICKUP', () => {
      const actual = getNextValidStatuses('READY_FOR_PICKUP')
      logTestCase('getNextValidStatuses("READY_FOR_PICKUP")', {
        input: 'READY_FOR_PICKUP',
        expected: ['OUT_FOR_DELIVERY', 'CANCELLED'],
        actual,
      })
      expect(actual).toEqual(['OUT_FOR_DELIVERY', 'CANCELLED'])
    })

    it('should return [DELIVERED, CANCELLED] for OUT_FOR_DELIVERY', () => {
      const actual = getNextValidStatuses('OUT_FOR_DELIVERY')
      logTestCase('getNextValidStatuses("OUT_FOR_DELIVERY")', {
        input: 'OUT_FOR_DELIVERY',
        expected: ['DELIVERED', 'CANCELLED'],
        actual,
      })
      expect(actual).toEqual(['DELIVERED', 'CANCELLED'])
    })
  })
})
