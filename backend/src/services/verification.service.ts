import crypto from 'crypto'
import { TokenType } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { BadRequestError, NotFoundError } from '../utils/errors'

const EMAIL_VERIFICATION_EXPIRY_HOURS = 24
const PASSWORD_RESET_EXPIRY_HOURS = 1

export async function createVerificationToken(
  userId: string,
  type: TokenType
): Promise<string> {
  // Invalidate any existing tokens of the same type for this user
  await prisma.verificationToken.updateMany({
    where: {
      userId,
      type,
      usedAt: null,
    },
    data: {
      usedAt: new Date(), // Mark as used to invalidate
    },
  })

  const token = crypto.randomBytes(32).toString('hex')
  const expiryHours = type === TokenType.EMAIL_VERIFICATION
    ? EMAIL_VERIFICATION_EXPIRY_HOURS
    : PASSWORD_RESET_EXPIRY_HOURS

  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + expiryHours)

  await prisma.verificationToken.create({
    data: {
      token,
      type,
      userId,
      expiresAt,
    },
  })

  return token
}

export async function verifyEmailToken(token: string): Promise<string> {
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!verificationToken) {
    throw new NotFoundError('Invalid token', 'The verification token is invalid or does not exist')
  }

  if (verificationToken.type !== TokenType.EMAIL_VERIFICATION) {
    throw new BadRequestError('Invalid token type', 'This token is not for email verification')
  }

  if (verificationToken.usedAt) {
    throw new BadRequestError('Token already used', 'This verification token has already been used')
  }

  if (verificationToken.expiresAt < new Date()) {
    throw new BadRequestError('Token expired', 'This verification token has expired. Please request a new one.')
  }

  await prisma.$transaction([
    prisma.verificationToken.update({
      where: { id: verificationToken.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: true },
    }),
  ])

  return verificationToken.userId
}

export async function verifyPasswordResetToken(token: string): Promise<{ userId: string; email: string }> {
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!verificationToken) {
    throw new NotFoundError('Invalid token', 'The reset token is invalid or does not exist')
  }

  if (verificationToken.type !== TokenType.PASSWORD_RESET) {
    throw new BadRequestError('Invalid token type', 'This token is not for password reset')
  }

  if (verificationToken.usedAt) {
    throw new BadRequestError('Token already used', 'This reset token has already been used')
  }

  if (verificationToken.expiresAt < new Date()) {
    throw new BadRequestError('Token expired', 'This reset token has expired. Please request a new one.')
  }

  return {
    userId: verificationToken.userId,
    email: verificationToken.user.email,
  }
}

export async function consumePasswordResetToken(token: string): Promise<string> {
  const { userId } = await verifyPasswordResetToken(token)

  await prisma.verificationToken.update({
    where: { token },
    data: { usedAt: new Date() },
  })

  return userId
}

export async function cleanExpiredTokens(): Promise<number> {
  const result = await prisma.verificationToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        {
          usedAt: {
            not: null,
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Keep used tokens for 24 hours for audit
          },
        },
      ],
    },
  })

  return result.count
}
