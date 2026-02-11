import sharp from 'sharp'
import { BadRequestError } from './errors'

export type ImageType = 'avatar' | 'restaurant-logo' | 'restaurant-cover' | 'restaurant-gallery' | 'menu-item' | 'category-icon'

interface ImageConfig {
  width: number
  height: number
  fit: keyof sharp.FitEnum
  quality: number
}

const IMAGE_CONFIGS: Record<ImageType, ImageConfig> = {
  'avatar': { width: 400, height: 400, fit: 'cover', quality: 80 },
  'restaurant-logo': { width: 400, height: 400, fit: 'cover', quality: 80 },
  'restaurant-cover': { width: 1200, height: 600, fit: 'cover', quality: 80 },
  'restaurant-gallery': { width: 1200, height: 800, fit: 'inside', quality: 80 },
  'menu-item': { width: 800, height: 600, fit: 'inside', quality: 80 },
  'category-icon': { width: 200, height: 200, fit: 'cover', quality: 80 },
}

const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function validateImageFile(mimetype: string, size: number): void {
  if (!ALLOWED_MIMETYPES.includes(mimetype)) {
    throw new BadRequestError(
      'Invalid file type',
      'Only JPEG, PNG, WebP, JPG and GIF images are allowed'
    )
  }
  if (size > MAX_FILE_SIZE) {
    throw new BadRequestError(
      'File too large',
      'Image must be smaller than 5MB'
    )
  }
}

export function isValidImageType(type: string): type is ImageType {
  return type in IMAGE_CONFIGS
}

export async function optimizeImage(buffer: Buffer, type: ImageType): Promise<Buffer> {
  const cfg = IMAGE_CONFIGS[type]

  return sharp(buffer)
    .resize(cfg.width, cfg.height, { fit: cfg.fit, withoutEnlargement: true })
    .webp({ quality: cfg.quality })
    .rotate() 
    .toBuffer()
}
