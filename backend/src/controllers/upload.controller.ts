import { Response, NextFunction } from 'express'
import crypto from 'crypto'
import { uploadToGCS, deleteFromGCS, extractGCSPath } from '../lib/gcs'
import { validateImageFile, optimizeImage, isValidImageType, ImageType } from '../utils/image'
import { BadRequestError } from '../utils/errors'
import { AuthenticatedRequest } from '../types'

function buildGCSPath(type: ImageType, userId: string, entityId?: string): string {
  const filename = `${crypto.randomUUID()}.webp`

  switch (type) {
    case 'avatar':
      return `avatars/${userId}/${filename}`
    case 'restaurant-logo':
    case 'restaurant-cover':
    case 'restaurant-gallery':
      return `restaurants/${entityId || userId}/${filename}`
    case 'menu-item':
      return `menu-items/${filename}`
    case 'category-icon':
      return `categories/${filename}`
  }
}

export async function uploadImage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const file = req.file
    if (!file) {
      throw new BadRequestError('No file', 'Please provide an image file')
    }

    const type = req.query.type as string
    if (!type || !isValidImageType(type)) {
      throw new BadRequestError(
        'Invalid type',
        'Query parameter "type" must be one of: avatar, restaurant-logo, restaurant-cover, restaurant-gallery, menu-item, category-icon'
      )
    }

    const entityId = req.query.entityId as string | undefined
    validateImageFile(file.mimetype, file.size)

    const optimized = await optimizeImage(file.buffer, type)

    const objectPath = buildGCSPath(type, req.user!.userId, entityId)
    const url = await uploadToGCS(optimized, objectPath, 'image/webp')

    res.status(201).json({ url })
  } catch (err) {
    next(err)
  }
}

export async function deleteImage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { url } = req.body
    if (!url || typeof url !== 'string') {
      throw new BadRequestError('Missing URL', 'Please provide the image URL to delete')
    }

    const objectPath = extractGCSPath(url)
    if (!objectPath) {
      throw new BadRequestError('Invalid URL', 'The provided URL is not a valid GCS image URL')
    }

    if (objectPath.includes('..') || objectPath.startsWith('/')) {
      throw new BadRequestError('Invalid path', 'The image path contains invalid characters')
    }

    await deleteFromGCS(objectPath)

    res.json({ message: 'Image deleted' })
  } catch (err) {
    next(err)
  }
}
