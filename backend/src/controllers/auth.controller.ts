import { Request, Response, NextFunction } from 'express'
import * as authService from '../services/auth.service'
import * as userService from '../services/user.service'
import { validateRegister, validateRegisterRestaurant, validateLogin, validatePassword, validateEmail } from '../validators/auth.validator'
import { BadRequestError, NotFoundError } from '../utils/errors'
import { AuthenticatedRequest, RegisterDto, RegisterRestaurantDto, LoginDto } from '../types'
import { setAuthCookies, clearAuthCookies, getRefreshTokenFromCookie } from '../utils/cookies'

export async function register(
  req: Request<object, object, RegisterDto>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    validateRegister(req.body)
    const { user, accessToken, refreshToken } = await authService.register(req.body)

    setAuthCookies(res, accessToken, refreshToken)

    res.status(201).json({
      message: 'User created successfully. Please check your email to verify your account.',
      user,
    })
  } catch (error) {
    next(error)
  }
}

export async function registerRestaurant(
  req: Request<object, object, RegisterRestaurantDto>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    validateRegisterRestaurant(req.body)
    const { user, accessToken, refreshToken } = await authService.registerRestaurant(req.body)

    setAuthCookies(res, accessToken, refreshToken)

    res.status(201).json({
      message: 'Restaurant registered successfully. Please check your email to verify your account.',
      user,
    })
  } catch (error) {
    next(error)
  }
}

export async function login(
  req: Request<object, object, LoginDto>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    validateLogin(req.body)
    const { user, accessToken, refreshToken } = await authService.login(req.body)

    setAuthCookies(res, accessToken, refreshToken)

    res.json({ message: 'Login successful', user })
  } catch (error) {
    next(error)
  }
}

export async function logout(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const refreshToken = getRefreshTokenFromCookie(req.cookies || {})

    if (refreshToken) {
      await authService.logout(refreshToken)
    }

    clearAuthCookies(res)

    res.json({ message: 'Logged out successfully' })
  } catch (error) {
    next(error)
  }
}

export async function logoutAll(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    await authService.logoutAll(req.user.userId)
    clearAuthCookies(res)

    res.json({ message: 'Logged out from all devices successfully' })
  } catch (error) {
    next(error)
  }
}

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const refreshToken = getRefreshTokenFromCookie(req.cookies || {})

    if (!refreshToken) {
      throw new BadRequestError('Missing token', 'Refresh token is required')
    }

    const { accessToken, refreshToken: newRefreshToken, user } = await authService.refreshTokens(refreshToken)

    setAuthCookies(res, accessToken, newRefreshToken)

    res.json({ message: 'Tokens refreshed successfully', user })
  } catch (error) {
    clearAuthCookies(res)
    next(error)
  }
}

export async function me(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await userService.findUserById(req.user!.userId)

    if (!user) {
      throw new NotFoundError('User not found', 'User no longer exists')
    }

    res.json({ user })
  } catch (error) {
    next(error)
  }
}

export async function verifyEmail(
  req: Request<object, object, object, { token?: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token } = req.query

    if (!token) {
      throw new BadRequestError('Missing token', 'Verification token is required')
    }

    const user = await authService.verifyEmail(token)

    res.json({ message: 'Email verified successfully', user })
  } catch (error) {
    next(error)
  }
}

export async function resendVerification(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    await authService.resendVerificationEmail(req.user.userId)

    res.json({ message: 'Verification email sent successfully' })
  } catch (error) {
    next(error)
  }
}

export async function forgotPassword(
  req: Request<object, object, { email: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = req.body

    if (!email) {
      throw new BadRequestError('Missing email', 'Email is required')
    }

    validateEmail(email)
    await authService.forgotPassword(email)

    res.json({
      message: 'If an account with that email exists, we have sent a password reset link.',
    })
  } catch (error) {
    next(error)
  }
}

export async function resetPassword(
  req: Request<object, object, { token: string; password: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token, password } = req.body

    if (!token) {
      throw new BadRequestError('Missing token', 'Reset token is required')
    }

    if (!password) {
      throw new BadRequestError('Missing password', 'New password is required')
    }

    validatePassword(password)
    await authService.resetPassword(token, password)

    res.json({ message: 'Password reset successfully. Please log in with your new password.' })
  } catch (error) {
    next(error)
  }
}

interface GoogleAuthBody {
  email: string
  firstName: string
  lastName: string
  providerId: string
  avatarUrl?: string
}

export async function googleAuth(
  req: Request<object, object, GoogleAuthBody>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, firstName, lastName, providerId, avatarUrl } = req.body

    if (!email || !providerId) {
      throw new BadRequestError('Missing data', 'Email and provider ID are required')
    }

    const { user, accessToken, refreshToken } = await authService.googleAuth({
      email,
      firstName: firstName || '',
      lastName: lastName || '',
      providerId,
      avatarUrl,
    })

    setAuthCookies(res, accessToken, refreshToken)

    res.json({ message: 'Google authentication successful', user })
  } catch (error) {
    next(error)
  }
}
