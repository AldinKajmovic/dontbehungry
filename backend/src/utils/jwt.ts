import jwt from 'jsonwebtoken'
import { config } from '../config'
import { JwtPayload } from '../types'

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.accessExpiresIn })
}

export function generateRefreshTokenJwt(payload: { userId: string }): string {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.refreshExpiresIn })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.secret) as JwtPayload
}

// Deprecated: use generateAccessToken instead
export const generateToken = generateAccessToken
