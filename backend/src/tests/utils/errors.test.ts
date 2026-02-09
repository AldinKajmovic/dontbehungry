import { logTestCase } from '../helpers/testLogger'
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
  TooManyRequestsError,
} from '../../utils/errors'

describe('Custom Error Classes', () => {
  describe('AppError', () => {
    it('should set statusCode, error, and details', () => {
      const err = new AppError(500, 'Server Error', 'Something went wrong')
      logTestCase('AppError constructor', {
        input: { statusCode: 500, error: 'Server Error', details: 'Something went wrong' },
        expected: { statusCode: 500, error: 'Server Error', details: 'Something went wrong' },
        actual: { statusCode: err.statusCode, error: err.error, details: err.details },
      })
      expect(err.statusCode).toBe(500)
      expect(err.error).toBe('Server Error')
      expect(err.details).toBe('Something went wrong')
    })

    it('should be an instance of Error', () => {
      const err = new AppError(500, 'Test', 'test')
      const actual = err instanceof Error
      logTestCase('AppError instanceof Error', {
        input: 'new AppError(500, "Test", "test")',
        expected: true,
        actual,
      })
      expect(actual).toBe(true)
    })

    it('should have message equal to details', () => {
      const err = new AppError(422, 'Validation', 'Field is invalid')
      logTestCase('AppError message === details', {
        input: 'details: "Field is invalid"',
        expected: 'Field is invalid',
        actual: err.message,
      })
      expect(err.message).toBe('Field is invalid')
    })

    it('should have name set to AppError', () => {
      const err = new AppError(500, 'Test', 'test')
      logTestCase('AppError.name', {
        input: 'new AppError()',
        expected: 'AppError',
        actual: err.name,
      })
      expect(err.name).toBe('AppError')
    })
  })

  describe('BadRequestError', () => {
    it('should have statusCode 400', () => {
      const err = new BadRequestError('Bad input', 'Name is required')
      logTestCase('BadRequestError statusCode', {
        input: { error: 'Bad input', details: 'Name is required' },
        expected: 400,
        actual: err.statusCode,
      })
      expect(err.statusCode).toBe(400)
    })

    it('should carry error and details', () => {
      const err = new BadRequestError('Invalid data', 'Email format wrong')
      logTestCase('BadRequestError fields', {
        input: { error: 'Invalid data', details: 'Email format wrong' },
        expected: { error: 'Invalid data', details: 'Email format wrong' },
        actual: { error: err.error, details: err.details },
      })
      expect(err.error).toBe('Invalid data')
      expect(err.details).toBe('Email format wrong')
    })

    it('should be instanceof AppError', () => {
      const err = new BadRequestError('Test', 'test')
      expect(err).toBeInstanceOf(AppError)
    })
  })

  describe('UnauthorizedError', () => {
    it('should have statusCode 401', () => {
      const err = new UnauthorizedError()
      logTestCase('UnauthorizedError default statusCode', {
        input: 'no args',
        expected: 401,
        actual: err.statusCode,
      })
      expect(err.statusCode).toBe(401)
    })

    it('should use default error and details', () => {
      const err = new UnauthorizedError()
      logTestCase('UnauthorizedError defaults', {
        input: 'no args',
        expected: { error: 'Unauthorized', details: 'Authentication required' },
        actual: { error: err.error, details: err.details },
      })
      expect(err.error).toBe('Unauthorized')
      expect(err.details).toBe('Authentication required')
    })

    it('should accept custom error and details', () => {
      const err = new UnauthorizedError('Token expired', 'Please log in again')
      logTestCase('UnauthorizedError custom', {
        input: { error: 'Token expired', details: 'Please log in again' },
        expected: { error: 'Token expired', details: 'Please log in again' },
        actual: { error: err.error, details: err.details },
      })
      expect(err.error).toBe('Token expired')
      expect(err.details).toBe('Please log in again')
    })
  })

  describe('NotFoundError', () => {
    it('should have statusCode 404', () => {
      const err = new NotFoundError('Not found', 'User not found')
      logTestCase('NotFoundError statusCode', {
        input: { error: 'Not found', details: 'User not found' },
        expected: 404,
        actual: err.statusCode,
      })
      expect(err.statusCode).toBe(404)
    })

    it('should carry provided error and details', () => {
      const err = new NotFoundError('Missing', 'Order #123 does not exist')
      expect(err.error).toBe('Missing')
      expect(err.details).toBe('Order #123 does not exist')
    })
  })

  describe('ForbiddenError', () => {
    it('should have statusCode 403', () => {
      const err = new ForbiddenError()
      logTestCase('ForbiddenError statusCode', {
        input: 'no args',
        expected: 403,
        actual: err.statusCode,
      })
      expect(err.statusCode).toBe(403)
    })

    it('should use default error and details', () => {
      const err = new ForbiddenError()
      logTestCase('ForbiddenError defaults', {
        input: 'no args',
        expected: { error: 'Forbidden', details: 'You do not have permission to access this resource' },
        actual: { error: err.error, details: err.details },
      })
      expect(err.error).toBe('Forbidden')
      expect(err.details).toBe('You do not have permission to access this resource')
    })

    it('should accept custom values', () => {
      const err = new ForbiddenError('Admin only', 'Admins only')
      expect(err.error).toBe('Admin only')
      expect(err.details).toBe('Admins only')
    })
  })

  describe('ConflictError', () => {
    it('should have statusCode 409', () => {
      const err = new ConflictError('Duplicate', 'Email already exists')
      logTestCase('ConflictError statusCode', {
        input: { error: 'Duplicate', details: 'Email already exists' },
        expected: 409,
        actual: err.statusCode,
      })
      expect(err.statusCode).toBe(409)
    })

    it('should carry provided error and details', () => {
      const err = new ConflictError('Conflict', 'Resource already exists')
      expect(err.error).toBe('Conflict')
      expect(err.details).toBe('Resource already exists')
    })
  })

  describe('TooManyRequestsError', () => {
    it('should have statusCode 429', () => {
      const err = new TooManyRequestsError()
      logTestCase('TooManyRequestsError statusCode', {
        input: 'no args',
        expected: 429,
        actual: err.statusCode,
      })
      expect(err.statusCode).toBe(429)
    })

    it('should use default error and details', () => {
      const err = new TooManyRequestsError()
      logTestCase('TooManyRequestsError defaults', {
        input: 'no args',
        expected: { error: 'Too Many Requests', details: 'Please try again later' },
        actual: { error: err.error, details: err.details },
      })
      expect(err.error).toBe('Too Many Requests')
      expect(err.details).toBe('Please try again later')
    })

    it('should accept custom values', () => {
      const err = new TooManyRequestsError('Rate limit', 'Try in 60s')
      expect(err.error).toBe('Rate limit')
      expect(err.details).toBe('Try in 60s')
    })
  })

  describe('Error inheritance chain', () => {
    it('all errors should be instances of Error and AppError', () => {
      const errors = [
        new BadRequestError('t', 't'),
        new UnauthorizedError(),
        new NotFoundError('t', 't'),
        new ForbiddenError(),
        new ConflictError('t', 't'),
        new TooManyRequestsError(),
      ]

      for (const err of errors) {
        const isError = err instanceof Error
        const isAppError = err instanceof AppError
        logTestCase(`${err.constructor.name} inheritance`, {
          input: err.constructor.name,
          expected: { isError: true, isAppError: true },
          actual: { isError, isAppError },
        })
        expect(isError).toBe(true)
        expect(isAppError).toBe(true)
      }
    })
  })
})
