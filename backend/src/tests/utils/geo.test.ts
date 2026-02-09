import { logTestCase } from '../helpers/testLogger'
import { haversineDistance } from '../../utils/geo'

describe('Haversine Distance Calculation', () => {
  describe('same point', () => {
    it('should return 0 for identical coordinates', () => {
      const actual = haversineDistance(0, 0, 0, 0)
      logTestCase('Same point (0,0) → (0,0)', {
        input: { lat1: 0, lng1: 0, lat2: 0, lng2: 0 },
        expected: 0,
        actual,
      })
      expect(actual).toBe(0)
    })

    it('should return 0 for identical non-zero coordinates', () => {
      const actual = haversineDistance(43.8563, 18.4131, 43.8563, 18.4131)
      logTestCase('Same point Sarajevo → Sarajevo', {
        input: { lat1: 43.8563, lng1: 18.4131, lat2: 43.8563, lng2: 18.4131 },
        expected: 0,
        actual,
      })
      expect(actual).toBe(0)
    })
  })

  describe('known distances', () => {
    it('should calculate Sarajevo to Mostar (~120 km)', () => {
      // Sarajevo (43.8563, 18.4131) to Mostar (43.3438, 17.8078)
      const actual = haversineDistance(43.8563, 18.4131, 43.3438, 17.8078)
      logTestCase('Sarajevo → Mostar (~120 km)', {
        input: { lat1: 43.8563, lng1: 18.4131, lat2: 43.3438, lng2: 17.8078 },
        expected: '~70-80 km straight line',
        actual: `${actual.toFixed(2)} km`,
      })
      // Straight-line distance is roughly 70-80 km
      expect(actual).toBeGreaterThan(60)
      expect(actual).toBeLessThan(90)
    })

    it('should calculate New York to Los Angeles (~3940 km)', () => {
      // NYC (40.7128, -74.0060) to LA (34.0522, -118.2437)
      const actual = haversineDistance(40.7128, -74.006, 34.0522, -118.2437)
      logTestCase('NYC → LA (~3940 km)', {
        input: { lat1: 40.7128, lng1: -74.006, lat2: 34.0522, lng2: -118.2437 },
        expected: '~3940 km',
        actual: `${actual.toFixed(2)} km`,
      })
      expect(actual).toBeGreaterThan(3900)
      expect(actual).toBeLessThan(4000)
    })

    it('should calculate London to Paris (~340 km)', () => {
      // London (51.5074, -0.1278) to Paris (48.8566, 2.3522)
      const actual = haversineDistance(51.5074, -0.1278, 48.8566, 2.3522)
      logTestCase('London → Paris (~340 km)', {
        input: { lat1: 51.5074, lng1: -0.1278, lat2: 48.8566, lng2: 2.3522 },
        expected: '~340 km',
        actual: `${actual.toFixed(2)} km`,
      })
      expect(actual).toBeGreaterThan(330)
      expect(actual).toBeLessThan(350)
    })
  })

  describe('antipodal points', () => {
    it('should return ~20015 km for north pole to south pole', () => {
      const actual = haversineDistance(90, 0, -90, 0)
      logTestCase('North Pole → South Pole', {
        input: { lat1: 90, lng1: 0, lat2: -90, lng2: 0 },
        expected: '~20015 km (half earth circumference)',
        actual: `${actual.toFixed(2)} km`,
      })
      expect(actual).toBeGreaterThan(20000)
      expect(actual).toBeLessThan(20100)
    })

    it('should return ~20015 km for diametrically opposite points on equator', () => {
      const actual = haversineDistance(0, 0, 0, 180)
      logTestCase('(0,0) → (0,180)', {
        input: { lat1: 0, lng1: 0, lat2: 0, lng2: 180 },
        expected: '~20015 km',
        actual: `${actual.toFixed(2)} km`,
      })
      expect(actual).toBeGreaterThan(20000)
      expect(actual).toBeLessThan(20100)
    })
  })

  describe('equator distances', () => {
    it('should calculate ~111 km for 1 degree of longitude at equator', () => {
      const actual = haversineDistance(0, 0, 0, 1)
      logTestCase('1 degree longitude at equator', {
        input: { lat1: 0, lng1: 0, lat2: 0, lng2: 1 },
        expected: '~111 km',
        actual: `${actual.toFixed(2)} km`,
      })
      expect(actual).toBeGreaterThan(110)
      expect(actual).toBeLessThan(112)
    })

    it('should calculate ~111 km for 1 degree of latitude', () => {
      const actual = haversineDistance(0, 0, 1, 0)
      logTestCase('1 degree latitude', {
        input: { lat1: 0, lng1: 0, lat2: 1, lng2: 0 },
        expected: '~111 km',
        actual: `${actual.toFixed(2)} km`,
      })
      expect(actual).toBeGreaterThan(110)
      expect(actual).toBeLessThan(112)
    })
  })

  describe('negative coordinates', () => {
    it('should handle negative latitudes (southern hemisphere)', () => {
      // Sydney (-33.8688, 151.2093) to Melbourne (-37.8136, 144.9631)
      const actual = haversineDistance(-33.8688, 151.2093, -37.8136, 144.9631)
      logTestCase('Sydney → Melbourne', {
        input: { lat1: -33.8688, lng1: 151.2093, lat2: -37.8136, lng2: 144.9631 },
        expected: '~710 km',
        actual: `${actual.toFixed(2)} km`,
      })
      expect(actual).toBeGreaterThan(700)
      expect(actual).toBeLessThan(730)
    })

    it('should handle crossing the prime meridian', () => {
      // Lisbon (38.7223, -9.1393) to Madrid (40.4168, -3.7038)
      const actual = haversineDistance(38.7223, -9.1393, 40.4168, -3.7038)
      logTestCase('Lisbon → Madrid', {
        input: { lat1: 38.7223, lng1: -9.1393, lat2: 40.4168, lng2: -3.7038 },
        expected: '~500 km',
        actual: `${actual.toFixed(2)} km`,
      })
      expect(actual).toBeGreaterThan(490)
      expect(actual).toBeLessThan(520)
    })
  })

  describe('symmetry', () => {
    it('should return the same distance regardless of direction', () => {
      const d1 = haversineDistance(43.8563, 18.4131, 48.8566, 2.3522)
      const d2 = haversineDistance(48.8566, 2.3522, 43.8563, 18.4131)
      logTestCase('Distance symmetry A→B === B→A', {
        input: { pointA: 'Sarajevo', pointB: 'Paris' },
        expected: 'equal',
        actual: { d1: d1.toFixed(4), d2: d2.toFixed(4) },
      })
      expect(d1).toBeCloseTo(d2, 10)
    })
  })

  describe('short distances', () => {
    it('should handle very short distances (meters apart)', () => {
      // Two points ~100m apart
      const actual = haversineDistance(43.8563, 18.4131, 43.8572, 18.4131)
      logTestCase('Very short distance (~100m)', {
        input: { lat1: 43.8563, lng1: 18.4131, lat2: 43.8572, lng2: 18.4131 },
        expected: '< 0.2 km',
        actual: `${actual.toFixed(4)} km`,
      })
      expect(actual).toBeLessThan(0.2)
      expect(actual).toBeGreaterThan(0)
    })
  })
})
