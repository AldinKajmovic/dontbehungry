import { Request, Response, NextFunction } from 'express'
import { doubleCsrf } from 'csrf-csrf'

const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () => 'test-secret',
  getSessionIdentifier: (req) => req.cookies?.accessToken ?? '',
  cookieName: '_csrfSecret',
  cookieOptions: { httpOnly: true, secure: false, sameSite: 'lax', path: '/' },
  getCsrfTokenFromRequest: (req) => req.headers['x-csrf-token'] as string,
})

function createRequest(overrides: Partial<Request> = {}): Request {
  return {
    method: 'GET',
    headers: {},
    cookies: {},
    ...overrides,
  } as unknown as Request
}

function createResponse(): Response & { _cookies: Record<string, string> } {
  const res = {
    _cookies: {} as Record<string, string>,
    cookie: jest.fn().mockImplementation(function (this: { _cookies: Record<string, string> }, name: string, value: string) {
      this._cookies[name] = value
    }),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response & { _cookies: Record<string, string> }
  return res
}

describe('CSRF protection (csrf-csrf)', () => {
  it('allows GET requests without a token', (done) => {
    const req = createRequest({ method: 'GET' })
    const res = createResponse()
    const next: NextFunction = (err?: unknown) => {
      expect(err).toBeUndefined()
      done()
    }
    doubleCsrfProtection(req, res, next)
  })

  it('rejects POST requests without a CSRF token', (done) => {
    const req = createRequest({ method: 'POST' })
    const res = createResponse()
    const next: NextFunction = (err?: unknown) => {
      expect(err).toBeDefined()
      done()
    }
    doubleCsrfProtection(req, res, next)
  })

  it('allows POST requests with a valid CSRF token', (done) => {
    const req = createRequest()
    const res = createResponse()

    // Generate token (sets cookie on res)
    const token = generateCsrfToken(req, res)

    // Copy cookie to the request for validation
    req.cookies = { ...req.cookies, ...res._cookies }
    ;(req as unknown as Record<string, unknown>).method = 'POST'
    ;(req as unknown as Record<string, Record<string, string>>).headers['x-csrf-token'] = token

    const next: NextFunction = (err?: unknown) => {
      expect(err).toBeUndefined()
      done()
    }
    doubleCsrfProtection(req, res, next)
  })

  it('rejects POST requests with an invalid CSRF token', (done) => {
    const req = createRequest()
    const res = createResponse()

    // Generate token to set up the cookie
    generateCsrfToken(req, res)

    // Copy cookie but use wrong token
    req.cookies = { ...req.cookies, ...res._cookies }
    ;(req as unknown as Record<string, unknown>).method = 'POST'
    ;(req as unknown as Record<string, Record<string, string>>).headers['x-csrf-token'] = 'invalid-token'

    const next: NextFunction = (err?: unknown) => {
      expect(err).toBeDefined()
      done()
    }
    doubleCsrfProtection(req, res, next)
  })
})
