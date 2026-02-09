import { logTestCase } from '../helpers/testLogger'
import { validateImageFile, isValidImageType } from '../../utils/image'
import { BadRequestError } from '../../utils/errors'

describe('Image Utilities', () => {
  describe('validateImageFile — valid MIME types', () => {
    const validMimes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/jpg',
      'image/svg+xml',
    ]

    it.each(validMimes)('should accept MIME type: %s', (mime) => {
      const size = 1024 * 1024 // 1MB
      expect(() => validateImageFile(mime, size)).not.toThrow()
      logTestCase(`validateImageFile("${mime}", 1MB)`, {
        input: { mimetype: mime, size },
        expected: 'no error',
        actual: 'no error',
      })
    })
  })

  describe('validateImageFile — invalid MIME types', () => {
    const invalidMimes = [
      'image/bmp',
      'image/tiff',
      'application/pdf',
      'text/html',
      'video/mp4',
      'application/javascript',
      '',
    ]

    it.each(invalidMimes)('should reject MIME type: %s', (mime) => {
      try {
        validateImageFile(mime, 1024)
        fail('Expected BadRequestError')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        expect((error as BadRequestError).statusCode).toBe(400)
        logTestCase(`validateImageFile("${mime}", 1KB)`, {
          input: { mimetype: mime, size: 1024 },
          expected: 'BadRequestError: Invalid file type',
          actual: (error as BadRequestError).error,
        })
      }
    })
  })

  describe('validateImageFile — file size limits', () => {
    it('should accept file at exactly 5MB', () => {
      const size = 5 * 1024 * 1024
      expect(() => validateImageFile('image/jpeg', size)).not.toThrow()
      logTestCase('File at exactly 5MB', {
        input: { mimetype: 'image/jpeg', size },
        expected: 'no error',
        actual: 'no error',
      })
    })

    it('should reject file over 5MB', () => {
      const size = 5 * 1024 * 1024 + 1
      try {
        validateImageFile('image/jpeg', size)
        fail('Expected BadRequestError')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('File over 5MB', {
          input: { mimetype: 'image/jpeg', size },
          expected: 'BadRequestError: File too large',
          actual: (error as BadRequestError).error,
        })
      }
    })

    it('should accept very small file (1 byte)', () => {
      expect(() => validateImageFile('image/png', 1)).not.toThrow()
      logTestCase('1 byte file', {
        input: { mimetype: 'image/png', size: 1 },
        expected: 'no error',
        actual: 'no error',
      })
    })

    it('should accept file at 0 bytes', () => {
      expect(() => validateImageFile('image/png', 0)).not.toThrow()
      logTestCase('0 byte file', {
        input: { mimetype: 'image/png', size: 0 },
        expected: 'no error',
        actual: 'no error',
      })
    })

    it('should reject 10MB file', () => {
      const size = 10 * 1024 * 1024
      try {
        validateImageFile('image/jpeg', size)
        fail('Expected BadRequestError')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        logTestCase('10MB file', {
          input: { mimetype: 'image/jpeg', size },
          expected: 'BadRequestError',
          actual: (error as BadRequestError).error,
        })
      }
    })
  })

  describe('validateImageFile — combined checks', () => {
    it('should check MIME before size (invalid MIME + oversized)', () => {
      try {
        validateImageFile('application/pdf', 10 * 1024 * 1024)
        fail('Expected BadRequestError')
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError)
        expect((error as BadRequestError).error).toBe('Invalid file type')
        logTestCase('Invalid MIME + oversized', {
          input: { mimetype: 'application/pdf', size: '10MB' },
          expected: 'Invalid file type (MIME checked first)',
          actual: (error as BadRequestError).error,
        })
      }
    })
  })

  describe('isValidImageType', () => {
    const validTypes = [
      'avatar',
      'restaurant-logo',
      'restaurant-cover',
      'restaurant-gallery',
      'menu-item',
      'category-icon',
    ]

    it.each(validTypes)('should return true for valid type: %s', (type) => {
      const actual = isValidImageType(type)
      logTestCase(`isValidImageType("${type}")`, {
        input: type,
        expected: true,
        actual,
      })
      expect(actual).toBe(true)
    })

    const invalidTypes = ['profile', 'banner', 'thumbnail', 'icon', '', 'AVATAR']

    it.each(invalidTypes)('should return false for invalid type: %s', (type) => {
      const actual = isValidImageType(type)
      logTestCase(`isValidImageType("${type}")`, {
        input: type,
        expected: false,
        actual,
      })
      expect(actual).toBe(false)
    })
  })
})
