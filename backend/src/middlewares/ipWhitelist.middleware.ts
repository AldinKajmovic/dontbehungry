import { Request, Response, NextFunction } from 'express'
import { config } from '../config'
import { ForbiddenError } from '../utils/errors'

function getClientIP(req: Request): string {
  // Check X-Forwarded-For header for proxied requests
  const forwardedFor = req.headers['x-forwarded-for']
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0]
    return normalizeIP(ips.trim())
  }

  const realIP = req.headers['x-real-ip']
  if (realIP) {
    return normalizeIP(Array.isArray(realIP) ? realIP[0] : realIP)
  }

  const remoteAddr = req.socket?.remoteAddress || req.ip || ''
  return normalizeIP(remoteAddr)
}

function normalizeIP(ip: string): string {
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    return '127.0.0.1'
  }

  if (ip.startsWith('::ffff:')) {
    return ip.substring(7)
  }

  return ip
}

export function ipWhitelist(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const whitelistedIPs = config.admin.whitelistedIPs

  if (whitelistedIPs.length === 0) {
    return next()
  }

  const clientIP = getClientIP(req)

  if (whitelistedIPs.includes(clientIP)) {
    return next()
  }

  console.warn(`[IP Whitelist] Access denied for IP: ${clientIP}. Requested: ${req.method} ${req.originalUrl}`)

  throw new ForbiddenError(
    'Access denied',
    'Your IP address is not authorized to access this resource'
  )
}
