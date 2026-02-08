export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export interface CropConfig {
  aspect: number
  shape: 'rect' | 'round'
}

export const CROP_CONFIGS: Record<string, CropConfig> = {
  'avatar': { aspect: 1, shape: 'round' },
  'restaurant-logo': { aspect: 1, shape: 'rect' },
  'restaurant-cover': { aspect: 2, shape: 'rect' },
  'restaurant-gallery': { aspect: 3 / 2, shape: 'rect' },
  'menu-item': { aspect: 4 / 3, shape: 'rect' },
  'category-icon': { aspect: 1, shape: 'rect' },
}

export function getCroppedImageFile(
  imageSrc: string,
  cropAreaPixels: CropArea,
  fileName = 'cropped.jpg'
): Promise<File> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = cropAreaPixels.width
      canvas.height = cropAreaPixels.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      ctx.drawImage(
        image,
        cropAreaPixels.x,
        cropAreaPixels.y,
        cropAreaPixels.width,
        cropAreaPixels.height,
        0,
        0,
        cropAreaPixels.width,
        cropAreaPixels.height
      )

      try {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas toBlob failed'))
              return
            }
            resolve(new File([blob], fileName, { type: 'image/jpeg' }))
          },
          'image/jpeg',
          0.95
        )
      } catch (e) {
        reject(new Error('Canvas tainted by cross-origin image'))
      }
    }
    image.onerror = () => reject(new Error('Failed to load image'))
    image.src = imageSrc
  })
}
