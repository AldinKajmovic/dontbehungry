import { logTestCase } from '../helpers/testLogger'

/**
 * These functions are private in LanguageProvider.tsx.
 * We replicate them here for unit testing since they contain pure logic.
 * The implementation matches the provider exactly.
 */
function getNestedValue(obj: unknown, path: string): string {
  const keys = path.split('.')
  let current: unknown = obj

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key]
    } else {
      return path // Return path as fallback if key not found
    }
  }

  return typeof current === 'string' ? current : path
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template

  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key]?.toString() ?? `{${key}}`
  })
}

describe('Language Utility Functions', () => {
  describe('getNestedValue', () => {
    const translations = {
      common: {
        save: 'Save',
        cancel: 'Cancel',
        buttons: {
          submit: 'Submit',
          reset: 'Reset',
        },
      },
      auth: {
        login: 'Log In',
        register: 'Register',
      },
      greeting: 'Hello',
    }

    it('should get a top-level value', () => {
      const actual = getNestedValue(translations, 'greeting')
      logTestCase('Top-level key', {
        input: { path: 'greeting' },
        expected: 'Hello',
        actual,
      })
      expect(actual).toBe('Hello')
    })

    it('should get a one-level nested value', () => {
      const actual = getNestedValue(translations, 'auth.login')
      logTestCase('One-level nesting', {
        input: { path: 'auth.login' },
        expected: 'Log In',
        actual,
      })
      expect(actual).toBe('Log In')
    })

    it('should get a deeply nested value', () => {
      const actual = getNestedValue(translations, 'common.buttons.submit')
      logTestCase('Deep nesting', {
        input: { path: 'common.buttons.submit' },
        expected: 'Submit',
        actual,
      })
      expect(actual).toBe('Submit')
    })

    it('should return the path for a missing top-level key', () => {
      const actual = getNestedValue(translations, 'missing')
      logTestCase('Missing top-level key', {
        input: { path: 'missing' },
        expected: 'missing',
        actual,
      })
      expect(actual).toBe('missing')
    })

    it('should return the path for a missing nested key', () => {
      const actual = getNestedValue(translations, 'auth.forgot')
      logTestCase('Missing nested key', {
        input: { path: 'auth.forgot' },
        expected: 'auth.forgot',
        actual,
      })
      expect(actual).toBe('auth.forgot')
    })

    it('should return the path for a missing deep key', () => {
      const actual = getNestedValue(translations, 'common.buttons.delete')
      logTestCase('Missing deep key', {
        input: { path: 'common.buttons.delete' },
        expected: 'common.buttons.delete',
        actual,
      })
      expect(actual).toBe('common.buttons.delete')
    })

    it('should return the path when intermediate key is missing', () => {
      const actual = getNestedValue(translations, 'nonexistent.path.key')
      logTestCase('Missing intermediate key', {
        input: { path: 'nonexistent.path.key' },
        expected: 'nonexistent.path.key',
        actual,
      })
      expect(actual).toBe('nonexistent.path.key')
    })

    it('should return the path when value is not a string (object)', () => {
      const actual = getNestedValue(translations, 'common.buttons')
      logTestCase('Value is object, not string', {
        input: { path: 'common.buttons' },
        expected: 'common.buttons',
        actual,
      })
      expect(actual).toBe('common.buttons')
    })

    it('should handle null obj', () => {
      const actual = getNestedValue(null, 'some.key')
      logTestCase('Null object', {
        input: { obj: null, path: 'some.key' },
        expected: 'some.key',
        actual,
      })
      expect(actual).toBe('some.key')
    })

    it('should handle empty path', () => {
      const actual = getNestedValue(translations, '')
      logTestCase('Empty path', {
        input: { path: '' },
        expected: '',
        actual,
      })
      // With empty string, path.split('.') gives [''] which is not in obj
      expect(actual).toBe('')
    })

    it('should handle numeric-like keys', () => {
      const obj = { items: { '0': 'first', '1': 'second' } }
      const actual = getNestedValue(obj, 'items.0')
      logTestCase('Numeric key', {
        input: { path: 'items.0' },
        expected: 'first',
        actual,
      })
      expect(actual).toBe('first')
    })
  })

  describe('interpolate', () => {
    it('should return template unchanged when no params', () => {
      const actual = interpolate('Hello World')
      logTestCase('No params', {
        input: { template: 'Hello World', params: undefined },
        expected: 'Hello World',
        actual,
      })
      expect(actual).toBe('Hello World')
    })

    it('should replace a single parameter', () => {
      const actual = interpolate('Hello {name}', { name: 'John' })
      logTestCase('Single param', {
        input: { template: 'Hello {name}', params: { name: 'John' } },
        expected: 'Hello John',
        actual,
      })
      expect(actual).toBe('Hello John')
    })

    it('should replace multiple parameters', () => {
      const actual = interpolate('{greeting} {name}, you have {count} items', {
        greeting: 'Hi',
        name: 'Jane',
        count: 5,
      })
      logTestCase('Multiple params', {
        input: {
          template: '{greeting} {name}, you have {count} items',
          params: { greeting: 'Hi', name: 'Jane', count: 5 },
        },
        expected: 'Hi Jane, you have 5 items',
        actual,
      })
      expect(actual).toBe('Hi Jane, you have 5 items')
    })

    it('should keep placeholder for missing params', () => {
      const actual = interpolate('Hello {name}, age {age}', { name: 'John' })
      logTestCase('Missing param kept', {
        input: {
          template: 'Hello {name}, age {age}',
          params: { name: 'John' },
        },
        expected: 'Hello John, age {age}',
        actual,
      })
      expect(actual).toBe('Hello John, age {age}')
    })

    it('should handle numeric param values', () => {
      const actual = interpolate('Page {page} of {total}', { page: 1, total: 10 })
      logTestCase('Numeric params', {
        input: {
          template: 'Page {page} of {total}',
          params: { page: 1, total: 10 },
        },
        expected: 'Page 1 of 10',
        actual,
      })
      expect(actual).toBe('Page 1 of 10')
    })

    it('should handle template with no placeholders', () => {
      const actual = interpolate('No placeholders here', { name: 'ignored' })
      logTestCase('No placeholders', {
        input: {
          template: 'No placeholders here',
          params: { name: 'ignored' },
        },
        expected: 'No placeholders here',
        actual,
      })
      expect(actual).toBe('No placeholders here')
    })

    it('should handle empty template', () => {
      const actual = interpolate('', { name: 'test' })
      logTestCase('Empty template', {
        input: { template: '', params: { name: 'test' } },
        expected: '',
        actual,
      })
      expect(actual).toBe('')
    })

    it('should handle empty params object', () => {
      const actual = interpolate('Hello {name}', {})
      logTestCase('Empty params object', {
        input: { template: 'Hello {name}', params: {} },
        expected: 'Hello {name}',
        actual,
      })
      expect(actual).toBe('Hello {name}')
    })

    it('should handle param value of 0', () => {
      const actual = interpolate('Count: {count}', { count: 0 })
      logTestCase('Param value is 0', {
        input: { template: 'Count: {count}', params: { count: 0 } },
        expected: 'Count: 0',
        actual,
      })
      expect(actual).toBe('Count: 0')
    })

    it('should replace same placeholder multiple times', () => {
      const actual = interpolate('{name} and {name} again', { name: 'Bob' })
      logTestCase('Repeated placeholder', {
        input: {
          template: '{name} and {name} again',
          params: { name: 'Bob' },
        },
        expected: 'Bob and Bob again',
        actual,
      })
      expect(actual).toBe('Bob and Bob again')
    })
  })
})
