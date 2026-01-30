import { Response, NextFunction } from 'express'
import * as addressService from '../services/address.service'
import { BadRequestError } from '../utils/errors'
import { sanitizeAddressData } from '../utils/sanitize'
import { AuthenticatedRequest } from '../types'

export async function getAddresses(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    const addresses = await addressService.getUserAddresses(req.user.userId)

    res.json({ addresses })
  } catch (error) {
    next(error)
  }
}

export async function addAddress(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    const sanitized = sanitizeAddressData(req.body)
    const { address, city, state, country, postalCode, notes, isDefault } = sanitized

    if (!address || !city || !country) {
      throw new BadRequestError('Missing fields', 'Address, city, and country are required')
    }

    const newAddress = await addressService.addAddress(req.user.userId, {
      address,
      city,
      state: state || undefined,
      country,
      postalCode: postalCode || undefined,
      notes: notes || undefined,
      isDefault,
    })

    res.status(201).json({
      message: 'Address added successfully',
      address: newAddress,
    })
  } catch (error) {
    next(error)
  }
}

export async function updateAddress(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    const id = req.params.id as string
    const sanitized = sanitizeAddressData(req.body)
    const { address, city, state, country, postalCode, notes, isDefault } = sanitized

    const updatedAddress = await addressService.updateAddress(req.user.userId, id, {
      address,
      city,
      state,
      country,
      postalCode,
      notes,
      isDefault,
    })

    res.json({
      message: 'Address updated successfully',
      address: updatedAddress,
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteAddress(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    const id = req.params.id as string

    await addressService.deleteAddress(req.user.userId, id)

    res.json({ message: 'Address deleted successfully' })
  } catch (error) {
    next(error)
  }
}

export async function setDefaultAddress(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    const id = req.params.id as string

    const address = await addressService.setDefaultAddress(req.user.userId, id)

    res.json({
      message: 'Default address updated',
      address,
    })
  } catch (error) {
    next(error)
  }
}
