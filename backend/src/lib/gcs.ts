import { Storage, Bucket } from '@google-cloud/storage'
import { config } from '../config'
import { logger } from '../utils/logger'

let _bucket: Bucket | null = null
let _initialized = false

function getBucket(): Bucket | null {
  if (_initialized) return _bucket
  _initialized = true

  if (!config.gcs.bucketName) {
    logger.warn('GCS_BUCKET_NAME not configured — image uploads disabled')
    return null
  }

  try {
    const storageOptions: ConstructorParameters<typeof Storage>[0] = {
      projectId: config.gcs.projectId || undefined,
    }

    if (config.gcs.credentials) {
      try {
        storageOptions.credentials = JSON.parse(config.gcs.credentials)
      } catch {
        logger.error('GCS_CREDENTIALS is not valid JSON')
        return null
      }
    }

    const storage = new Storage(storageOptions)
    _bucket = storage.bucket(config.gcs.bucketName)
  } catch (err) {
    logger.error('Failed to initialize GCS client', { error: err })
    _bucket = null
  }

  return _bucket
}

export async function uploadToGCS(
  buffer: Buffer,
  objectPath: string,
  contentType: string
): Promise<string> {
  const bucket = getBucket()
  if (!bucket) {
    throw new Error('GCS is not configured. Set GCS_BUCKET_NAME and GCS_CREDENTIALS and GCS_PROJECT_ID environment variables.')
  }

  const file = bucket.file(objectPath)
  // 1 year cache, resumable is false because images have small size
  await file.save(buffer, {
    contentType,
    resumable: false,
    metadata: {
      cacheControl: 'public, max-age=31536000',
    },
  })

  return `https://storage.googleapis.com/${config.gcs.bucketName}/${objectPath}`
}

export async function deleteFromGCS(objectPath: string): Promise<void> {
  const bucket = getBucket()
  if (!bucket) return

  try {
    await bucket.file(objectPath).delete()
  } catch (err: unknown) {
    const code = (err as { code?: number }).code
    if (code !== 404) {
      logger.error('Failed to delete GCS object', { objectPath, error: err })
    }
  }
}

export function extractGCSPath(url: string): string | null {
  const prefix = `https://storage.googleapis.com/${config.gcs.bucketName}/`
  if (!url.startsWith(prefix)) return null
  return url.slice(prefix.length)
}

export function isGCSUrl(url: string): boolean {
  return url.startsWith('https://storage.googleapis.com/')
}

export interface GCSImage {
  name: string
  url: string
  size: number
  contentType: string
  created: string
  folder: string
}

const IMAGE_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg', 'image/svg+xml']
const MAX_LIST_RESULTS = 500

export async function listGCSImages(prefix?: string): Promise<GCSImage[]> {
  const bucket = getBucket()
  if (!bucket) return []

  if (prefix) {
    if (prefix.includes('..') || prefix.startsWith('/')) {
      throw new Error('Invalid prefix')
    }
  }

  try {
    const [files] = await bucket.getFiles({
      prefix: prefix || undefined,
      maxResults: MAX_LIST_RESULTS,
    })

    const images: GCSImage[] = []

    for (const file of files) {
      const [metadata] = await file.getMetadata()
      const contentType = metadata.contentType as string | undefined
      if (!contentType || !IMAGE_CONTENT_TYPES.includes(contentType)) continue

      const name = file.name
      const folder = name.includes('/') ? name.split('/')[0] : ''

      images.push({
        name,
        url: `https://storage.googleapis.com/${config.gcs.bucketName}/${name}`,
        size: parseInt(metadata.size as string, 10) || 0,
        contentType,
        created: metadata.timeCreated as string || '',
        folder,
      })
    }

    return images
  } catch (err) {
    logger.error('Failed to list GCS images', { prefix, error: err })
    return []
  }
}
