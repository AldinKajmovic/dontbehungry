import { NextFunction, Request, Response } from 'express'
import { csrfProtection } from '../../middlewares/csrf.middleware'

function createResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response

  return res
}

describe('csrfProtection', () => {
  it('allows safe methods without a token', () => {
    const req = {
      method: 'GET',
      cookies: {},
      header: jest.fn(),
    } as unknown as Request
    const res = createResponse()
    const next = jest.fn() as NextFunction

    csrfProtection(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('rejects unsafe methods when the csrf token is missing', () => {
    const req = {
      method: 'POST',
      cookies: {},
      header: jest.fn().mockReturnValue(undefined),
    } as unknown as Request
    const res = createResponse()
    const next = jest.fn() as NextFunction

    csrfProtection(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('rejects unsafe methods when the csrf token does not match', () => {
    const req = {
      method: 'PATCH',
      cookies: { csrfToken: 'cookie-token' },
      header: jest.fn().mockReturnValue('header-token'),
    } as unknown as Request
    const res = createResponse()
    const next = jest.fn() as NextFunction

    csrfProtection(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('allows unsafe methods when the csrf token matches', () => {
    const req = {
      method: 'DELETE',
      cookies: { csrfToken: 'shared-token' },
      header: jest.fn().mockReturnValue('shared-token'),
    } as unknown as Request
    const res = createResponse()
    const next = jest.fn() as NextFunction

    csrfProtection(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })
})
