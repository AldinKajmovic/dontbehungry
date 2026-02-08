import { listGCSImages, GCSImage } from '../../lib/gcs'

const ALLOWED_FOLDERS = ['restaurants', 'menu-items', 'categories', 'avatars']

export async function browseImages(folder?: string): Promise<GCSImage[]> {
  let prefix: string | undefined

  if (folder) {
    if (!ALLOWED_FOLDERS.includes(folder)) {
      throw new Error(`Invalid folder. Allowed: ${ALLOWED_FOLDERS.join(', ')}`)
    }
    prefix = `${folder}/`
  }

  return listGCSImages(prefix)
}
