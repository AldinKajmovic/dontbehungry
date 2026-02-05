// User profile controller: updateProfile, changePassword, updateAvatar, deleteAccount
import { Response, NextFunction } from 'express'
import * as profileService from '../../services/profile'
import { validateUpdateProfile, validateChangePassword } from '../../validators/profile.validator'
import { BadRequestError } from '../../utils/errors'
import { AuthenticatedRequest, UpdateProfile, ChangePassword } from '../../types'
import { clearAuthCookies } from '../../utils/cookies'

export async function updateProfile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    const data: UpdateProfile = req.body
    validateUpdateProfile(data)

    const { user, emailChanged, verificationEmailFailed } = await profileService.updateProfile(req.user.userId, data)

    let message = 'Profile updated successfully'
    if (emailChanged) {
      message = verificationEmailFailed
        ? 'Profile updated. Email changed but verification email failed to send. Please use resend verification.'
        : 'Profile updated successfully. Please verify your new email address.'
    }

    res.json({
      message,
      user,
      emailChanged,
      verificationEmailFailed,
    })
  } catch (error) {
    next(error)
  }
}

export async function changePassword(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    const data: ChangePassword = req.body
    validateChangePassword(data)

    await profileService.changePassword(req.user.userId, data)

    res.json({
      message: 'Password changed successfully. Please log in again on other devices.',
    })
  } catch (error) {
    next(error)
  }
}

export async function updateAvatar(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    const { avatarUrl } = req.body

    // Avatar URL can be null to remove the avatar
    if (avatarUrl !== undefined && avatarUrl !== null && typeof avatarUrl !== 'string') {
      throw new BadRequestError('Invalid avatar URL', 'Avatar URL must be a string or null')
    }

    // Security: Validate URL scheme to prevent javascript: or data: injection
    if (avatarUrl && typeof avatarUrl === 'string') {
      try {
        const url = new URL(avatarUrl)
        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new BadRequestError('Invalid avatar URL', 'Avatar URL must use http or https protocol')
        }
      } catch (err) {
        if (err instanceof BadRequestError) throw err
        throw new BadRequestError('Invalid avatar URL', 'Avatar URL must be a valid URL')
      }
    }

    const user = await profileService.updateAvatar(req.user.userId, avatarUrl ?? null)

    res.json({
      message: 'Avatar updated successfully',
      user,
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteAccount(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    await profileService.deleteAccount(req.user.userId)
    clearAuthCookies(res)

    res.json({
      message: 'Account deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}
