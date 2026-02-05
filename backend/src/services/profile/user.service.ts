// User profile management: updateProfile, changePassword, updateAvatar, deleteAccount
import { TokenType } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { hashPassword, comparePassword } from '../../utils/password'
import { BadRequestError, UnauthorizedError, NotFoundError, ConflictError } from '../../utils/errors'
import { UpdateProfile, ChangePassword, userSelectFields } from '../../types'
import { createVerificationToken } from '../verification.service'
import { sendVerificationEmail } from '../email.service'
import { revokeAllUserTokens } from '../token.service'
import { logger } from '../../utils/logger'
import { UpdateProfileResult, UserResponse } from './types'

export async function updateProfile(userId: string, data: UpdateProfile): Promise<UpdateProfileResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new NotFoundError('User not found', 'User does not exist')
  }

  const updateData: Record<string, string | boolean | null> = {}
  let emailChanged = false

  if (data.firstName !== undefined) {
    updateData.firstName = data.firstName.trim()
  }

  if (data.lastName !== undefined) {
    updateData.lastName = data.lastName.trim()
  }

  if (data.phone !== undefined) {
    updateData.phone = data.phone ? data.phone.trim() : null
  }

  if (data.email !== undefined) {
    const newEmail = data.email.toLowerCase().trim()

    if (newEmail !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: newEmail },
      })

      if (existingUser) {
        throw new ConflictError('Email taken', 'An account with this email already exists')
      }

      updateData.email = newEmail
      updateData.emailVerified = false
      emailChanged = true
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: userSelectFields,
  })

  let verificationEmailFailed = false
  if (emailChanged) {
    // Security: Revoke all existing tokens when email changes to force re-authentication
    try {
      await revokeAllUserTokens(userId)
    } catch (err) {
      logger.error('Failed to revoke tokens on email change', err, { userId })
    }

    try {
      const verificationToken = await createVerificationToken(userId, TokenType.EMAIL_VERIFICATION)
      await sendVerificationEmail(updatedUser.email, updatedUser.firstName, verificationToken)
    } catch (err) {
      logger.error('Failed to send verification email', err, { userId })
      verificationEmailFailed = true
    }
  }

  return { user: updatedUser, emailChanged, verificationEmailFailed }
}

export async function changePassword(userId: string, data: ChangePassword): Promise<void> {
  const { currentPassword, newPassword } = data

  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new NotFoundError('User not found', 'User does not exist')
  }

  if (!user.passwordHash) {
    throw new BadRequestError('No password set', 'This account uses social login. Please use that method to sign in.')
  }

  const isValidPassword = await comparePassword(currentPassword, user.passwordHash)

  if (!isValidPassword) {
    throw new UnauthorizedError('Invalid password', 'Current password is incorrect')
  }

  const newPasswordHash = await hashPassword(newPassword)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    }),
    prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ])
}

export async function updateAvatar(userId: string, avatarUrl: string | null): Promise<UserResponse> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new NotFoundError('User not found', 'User does not exist')
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl },
    select: userSelectFields,
  })

  return updatedUser
}

export async function deleteAccount(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new NotFoundError('User not found', 'User does not exist')
  }

  await prisma.user.delete({
    where: { id: userId },
  })
}
