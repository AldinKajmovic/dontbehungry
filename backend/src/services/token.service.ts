import crypto from 'crypto'
import { prisma } from '../lib/prisma'
import { JwtPayload } from '../types'
import { generateAccessToken } from '../utils/jwt'
import { UnauthorizedError } from '../utils/errors'

const REFRESH_TOKEN_EXPIRY_DAYS = 7

interface TokenPair {
  accessToken: string
  refreshToken: string
}

export async function generateTokenPair(payload: JwtPayload): Promise<TokenPair> {
  const accessToken = generateAccessToken(payload)
  const refreshToken = await createRefreshToken(payload.userId)

  return { accessToken, refreshToken }
}

async function createRefreshToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(64).toString('hex')
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS)

  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  })

  return token
}

export async function rotateRefreshToken(
  oldToken: string,
  userPayload: JwtPayload
): Promise<TokenPair> {
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: oldToken },
    include: { user: true },
  })

  if (!storedToken) {
    throw new UnauthorizedError('Invalid refresh token')
  }

  if (storedToken.revokedAt) {
    await revokeAllUserTokens(storedToken.userId)
    throw new UnauthorizedError('Token reuse detected. All sessions have been revoked.')
  }

  if (storedToken.expiresAt < new Date()) {
    throw new UnauthorizedError('Refresh token has expired')
  }

  const newAccessToken = generateAccessToken(userPayload)
  const newRefreshToken = crypto.randomBytes(64).toString('hex')
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS)

  // Revoke old token and create new one 
  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        revokedAt: new Date(),
        replacedBy: newRefreshToken,
      },
    }),
    prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: storedToken.userId,
        expiresAt,
      },
    }),
  ])

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  }
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token },
  })

  if (storedToken && !storedToken.revokedAt) {
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    })
  }
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  })
}

export async function validateRefreshToken(token: string): Promise<{ userId: string } | null> {
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!storedToken) {
    return null
  }

  if (storedToken.revokedAt || storedToken.expiresAt < new Date()) {
    return null
  }

  return { userId: storedToken.userId }
}

export async function cleanExpiredTokens(): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        {
          revokedAt: {
            not: null,
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Keep revoked tokens for 7 days for audit
          },
        },
      ],
    },
  })

  return result.count
}
