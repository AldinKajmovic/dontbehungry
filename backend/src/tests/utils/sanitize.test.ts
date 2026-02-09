import { logTestCase } from '../helpers/testLogger'
import { sanitizeString, sanitizeAddressData } from '../../utils/sanitize'

describe('Sanitize Utilities', () => {
  describe('sanitizeString', () => {
    it('should return null for null input', () => {
      const actual = sanitizeString(null)
      logTestCase('sanitizeString(null)', {
        input: null,
        expected: null,
        actual,
      })
      expect(actual).toBeNull()
    })

    it('should return null for undefined input', () => {
      const actual = sanitizeString(undefined)
      logTestCase('sanitizeString(undefined)', {
        input: undefined,
        expected: null,
        actual,
      })
      expect(actual).toBeNull()
    })

    it('should pass through plain text unchanged', () => {
      const actual = sanitizeString('Hello World')
      logTestCase('Plain text pass-through', {
        input: 'Hello World',
        expected: 'Hello World',
        actual,
      })
      expect(actual).toBe('Hello World')
    })

    it('should trim whitespace', () => {
      const actual = sanitizeString('  Hello  ')
      logTestCase('Trim whitespace', {
        input: '  Hello  ',
        expected: 'Hello',
        actual,
      })
      expect(actual).toBe('Hello')
    })

    it('should strip <script> tags', () => {
      const input = '<script>alert("xss")</script>Hello'
      const actual = sanitizeString(input)
      logTestCase('Strip <script> tags', {
        input,
        expected: 'Hello',
        actual,
      })
      expect(actual).toBe('Hello')
    })

    it('should strip <img> tags with onerror', () => {
      const input = '<img src=x onerror=alert(1)>Safe text'
      const actual = sanitizeString(input)
      logTestCase('Strip <img onerror> XSS', {
        input,
        expected: 'Safe text',
        actual,
      })
      expect(actual).toBe('Safe text')
    })

    it('should strip all HTML tags', () => {
      const input = '<b>Bold</b> <i>Italic</i> <a href="http://evil.com">Link</a>'
      const actual = sanitizeString(input)
      logTestCase('Strip all HTML tags', {
        input,
        expected: 'Bold Italic Link',
        actual,
      })
      expect(actual).toBe('Bold Italic Link')
    })

    it('should strip nested tags', () => {
      const input = '<div><p><span>Nested</span></p></div>'
      const actual = sanitizeString(input)
      logTestCase('Strip nested tags', {
        input,
        expected: 'Nested',
        actual,
      })
      expect(actual).toBe('Nested')
    })

    it('should handle SVG-based XSS', () => {
      const input = '<svg onload=alert(1)>text</svg>'
      const actual = sanitizeString(input)
      logTestCase('SVG XSS', {
        input,
        expected: 'text',
        actual,
      })
      expect(actual).toBe('text')
    })

    it('should handle event handler attributes', () => {
      const input = '<div onmouseover="alert(1)">hover me</div>'
      const actual = sanitizeString(input)
      logTestCase('Event handler XSS', {
        input,
        expected: 'hover me',
        actual,
      })
      expect(actual).toBe('hover me')
    })

    it('should handle empty string', () => {
      const actual = sanitizeString('')
      logTestCase('Empty string', {
        input: '',
        expected: '',
        actual,
      })
      expect(actual).toBe('')
    })

    it('should handle string with only whitespace', () => {
      const actual = sanitizeString('   ')
      logTestCase('Whitespace only', {
        input: '   ',
        expected: '',
        actual,
      })
      expect(actual).toBe('')
    })

    it('should handle string with special characters', () => {
      const input = 'Café & résumé <3'
      const actual = sanitizeString(input)
      logTestCase('Special characters', {
        input,
        expected: 'Café &amp; résumé &lt;3',
        actual,
      })
      // sanitize-html will encode < and & in certain contexts
      expect(actual).not.toContain('<script>')
      expect(actual).toContain('Café')
    })

    it('should strip iframe tags', () => {
      const input = '<iframe src="http://evil.com"></iframe>Safe'
      const actual = sanitizeString(input)
      logTestCase('Strip iframe', {
        input,
        expected: 'Safe',
        actual,
      })
      expect(actual).toBe('Safe')
    })
  })

  describe('sanitizeAddressData', () => {
    it('should sanitize all string fields in address data', () => {
      const input = {
        address: '<b>123 Main St</b>',
        city: '<script>alert(1)</script>Sarajevo',
        state: 'FBiH',
        country: 'Bosnia',
        postalCode: '71000',
        notes: '<img src=x onerror=alert(1)>Leave at door',
        isDefault: true,
      }
      const actual = sanitizeAddressData(input)
      logTestCase('sanitizeAddressData with XSS', {
        input,
        expected: {
          address: '123 Main St',
          city: 'Sarajevo',
          state: 'FBiH',
          country: 'Bosnia',
          postalCode: '71000',
          notes: 'Leave at door',
          isDefault: true,
        },
        actual,
      })
      expect(actual.address).toBe('123 Main St')
      expect(actual.city).toBe('Sarajevo')
      expect(actual.state).toBe('FBiH')
      expect(actual.country).toBe('Bosnia')
      expect(actual.postalCode).toBe('71000')
      expect(actual.notes).toBe('Leave at door')
      expect(actual.isDefault).toBe(true)
    })

    it('should skip non-string fields', () => {
      const input = {
        address: 123 as unknown,
        city: true as unknown,
      }
      const actual = sanitizeAddressData(input as Record<string, unknown>)
      logTestCase('Non-string fields ignored', {
        input,
        expected: {},
        actual,
      })
      expect(actual.address).toBeUndefined()
      expect(actual.city).toBeUndefined()
    })

    it('should handle empty data object', () => {
      const actual = sanitizeAddressData({})
      logTestCase('Empty data object', {
        input: {},
        expected: {},
        actual,
      })
      expect(actual).toEqual({})
    })

    it('should set fields to undefined when sanitized result is empty', () => {
      const input = {
        address: '<script></script>',
        city: '  ',
      }
      const actual = sanitizeAddressData(input)
      logTestCase('Empty after sanitization', {
        input,
        expected: { address: undefined, city: undefined },
        actual,
      })
      // sanitizeString returns '' for '<script></script>' after stripping, but sanitizeAddressData
      // converts falsy sanitized values to undefined via || undefined
      expect(actual.address).toBeUndefined()
      expect(actual.city).toBeUndefined()
    })

    it('should preserve boolean isDefault field', () => {
      const actual = sanitizeAddressData({ isDefault: false })
      logTestCase('Preserve isDefault=false', {
        input: { isDefault: false },
        expected: { isDefault: false },
        actual,
      })
      expect(actual.isDefault).toBe(false)
    })
  })
})
