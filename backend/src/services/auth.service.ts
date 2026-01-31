import { TokenType } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { hashPassword, comparePassword } from '../utils/password'
import { ConflictError, UnauthorizedError, BadRequestError } from '../utils/errors'
import { findUserByEmail, findUserById, userExists } from './user.service'
import { generateTokenPair, revokeRefreshToken, revokeAllUserTokens, rotateRefreshToken } from './token.service'
import { createVerificationToken, verifyEmailToken, verifyPasswordResetToken, consumePasswordResetToken } from './verification.service'
import { sendVerificationEmail, sendPasswordResetEmail } from './email.service'
import { Register, RegisterRestaurant, Login, userSelectFields, UserResponse, JwtPayload } from '../types'

interface AuthResult {
  user: UserResponse
  accessToken: string
  refreshToken: string
}

interface TokenRefreshResult {
  accessToken: string
  refreshToken: string
  user: UserResponse
}

export async function register(data: Register): Promise<AuthResult> {
  const { email, password, firstName, lastName, phone, address, city, country } = data

  if (await userExists(email)) {
    throw new ConflictError('User already exists', 'An account with this email already exists')
  }

  const passwordHash = await hashPassword(password)

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        phone: phone || null,
      },
      select: userSelectFields,
    })

    if (address && city && country) {
      const place = await tx.place.create({
        data: {
          address,
          city,
          country,
        },
      })

      await tx.userAddress.create({
        data: {
          userId: newUser.id,
          placeId: place.id,
          isDefault: true,
        },
      })
    }

    return newUser
  })

  const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role }
  const { accessToken, refreshToken } = await generateTokenPair(payload)

  createVerificationToken(user.id, TokenType.EMAIL_VERIFICATION)
    .then((verificationToken) => sendVerificationEmail(user.email, user.firstName, verificationToken))
    .catch((err) => console.error('Failed to send verification email:', {
      userId: user.id,
      email: user.email,
      error: err instanceof Error ? err.message : 'Unknown error',
    }))

  return { user, accessToken, refreshToken }
}

export async function registerRestaurant(data: RegisterRestaurant): Promise<AuthResult> {
  const {
    email,
    password,
    firstName,
    lastName,
    phone,
    restaurantName,
    restaurantDescription,
    restaurantPhone,
    restaurantEmail,
    address,
    city,
    country,
    postalCode,
  } = data

  if (await userExists(email)) {
    throw new ConflictError('User already exists', 'An account with this email already exists')
  }

  const passwordHash = await hashPassword(password)

  const user = await prisma.$transaction(async (tx) => {
    const place = await tx.place.create({
      data: {
        address,
        city,
        country,
        postalCode: postalCode || null,
      },
    })

    const user = await tx.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        phone: phone || null,
        role: 'RESTAURANT_OWNER',
      },
      select: userSelectFields,
    })

    await tx.restaurant.create({
      data: {
        name: restaurantName,
        description: restaurantDescription || null,
        phone: restaurantPhone || null,
        email: restaurantEmail || null,
        ownerId: user.id,
        placeId: place.id,
      },
    })

    return user
  })

  const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role }
  const { accessToken, refreshToken } = await generateTokenPair(payload)

  createVerificationToken(user.id, TokenType.EMAIL_VERIFICATION)
    .then((verificationToken) => sendVerificationEmail(user.email, user.firstName, verificationToken))
    .catch((err) => console.error('Failed to send verification email:', {
      userId: user.id,
      email: user.email,
      error: err instanceof Error ? err.message : 'Unknown error',
    }))

  return { user, accessToken, refreshToken }
}

export async function login(data: Login): Promise<AuthResult> {
  const { email, password } = data

  const user = await findUserByEmail(email)

  if (!user) {
    throw new UnauthorizedError('Invalid credentials', 'Email or password is incorrect')
  }

  if (!user.passwordHash) {
    throw new UnauthorizedError('Invalid credentials', 'Please use social login for this account')
  }

  const isValidPassword = await comparePassword(password, user.passwordHash)

  if (!isValidPassword) {
    throw new UnauthorizedError('Invalid credentials', 'Email or password is incorrect')
  }

  const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role }
  const { accessToken, refreshToken } = await generateTokenPair(payload)

  const userResponse: UserResponse = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    avatarUrl: user.avatarUrl,
  }

  return { user: userResponse, accessToken, refreshToken }
}

export async function logout(refreshToken: string): Promise<void> {
  await revokeRefreshToken(refreshToken)
}

export async function logoutAll(userId: string): Promise<void> {
  await revokeAllUserTokens(userId)
}

export async function refreshTokens(oldRefreshToken: string): Promise<TokenRefreshResult> {

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: oldRefreshToken },
    include: { user: true },
  })

  if (!storedToken) {
    throw new UnauthorizedError('Invalid refresh token')
  }

  const user = storedToken.user
  const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role }

  const { accessToken, refreshToken } = await rotateRefreshToken(oldRefreshToken, payload)

  const userResponse: UserResponse = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    avatarUrl: user.avatarUrl,
  }

  return { accessToken, refreshToken, user: userResponse }
}

export async function verifyEmail(token: string): Promise<UserResponse> {
  const userId = await verifyEmailToken(token)
  const user = await findUserById(userId)

  if (!user) {
    throw new BadRequestError('User not found', 'The user associated with this token no longer exists')
  }

  return user
}

export async function resendVerificationEmail(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new BadRequestError('User not found', 'User does not exist')
  }

  if (user.emailVerified) {
    throw new BadRequestError('Already verified', 'Your email is already verified')
  }

  const verificationToken = await createVerificationToken(user.id, TokenType.EMAIL_VERIFICATION)
  await sendVerificationEmail(user.email, user.firstName, verificationToken)
}

export async function forgotPassword(email: string): Promise<void> {
  const user = await findUserByEmail(email)

  if (!user) {
    return
  }

  if (!user.passwordHash) {
    return
  }

  const resetToken = await createVerificationToken(user.id, TokenType.PASSWORD_RESET)
  await sendPasswordResetEmail(user.email, user.firstName, resetToken)
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {

  await verifyPasswordResetToken(token)

  const userId = await consumePasswordResetToken(token)
  const passwordHash = await hashPassword(newPassword)
  
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    }),
    prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ])
}

interface GoogleAuthData {
  email: string
  firstName: string
  lastName: string
  providerId: string
  avatarUrl?: string
}

export async function googleAuth(data: GoogleAuthData): Promise<AuthResult> {
  const { email, firstName, lastName, providerId, avatarUrl } = data

  // Try to find existing user by email
  let user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: userSelectFields,
  })

  if (user) {
    // If user exists with LOCAL auth, link the Google account
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (fullUser?.authProvider === 'LOCAL') {
      // Update user to link Google account
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          authProvider: 'GOOGLE',
          providerId,
          avatarUrl: avatarUrl || fullUser.avatarUrl,
          emailVerified: true, // Google verifies email
        },
        select: userSelectFields,
      })
    } else if (fullUser?.providerId !== providerId) {
      // User exists with different Google account - this shouldn't happen normally
      throw new ConflictError('Account conflict', 'This email is linked to a different Google account')
    }
  } else {
    // Create new user with Google auth
    user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        firstName,
        lastName,
        authProvider: 'GOOGLE',
        providerId,
        avatarUrl,
        emailVerified: true, // Google verifies email
      },
      select: userSelectFields,
    })
  }

  const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role }
  const { accessToken, refreshToken } = await generateTokenPair(payload)

  return { user, accessToken, refreshToken }
}
