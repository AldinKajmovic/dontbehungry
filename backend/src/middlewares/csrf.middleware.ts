import type { Request, Response, NextFunction } from 'express'

/**
 * CSRF protection middleware using custom header validation.
 * Browsers enforce CORS preflight for custom headers, preventing cross-origin
 * form submissions from including the X-Requested-With header.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS']
  if (!safeMethods.includes(req.method) && !req.headers['x-requested-with']) {
    return res.status(403).json({
      error: 'Forbidden',
      details: 'Missing required X-Requested-With header',
    })
  }
  next()
}
