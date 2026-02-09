'use client'

import { useRef, useState } from 'react'
import { useLanguage } from '@/hooks/useLanguage'
import { CropModal } from './CropModal'
import { CropConfig } from './cropUtils'
import { ImageBrowserModal } from '@/components/admin/ImageBrowserModal'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

interface ImageUploadProps {
  currentUrl?: string | null
  onUpload: (file: File) => Promise<string | null>
  onRemove?: () => void
  uploading?: boolean
  shape?: 'square' | 'circle'
  label?: string
  hint?: string
  width?: string
  height?: string
  /** @deprecated Use browserFolder instead */
  onBrowse?: () => void
  cropConfig?: CropConfig
  browserFolder?: string
}

export function ImageUpload({
  currentUrl,
  onUpload,
  onRemove,
  uploading = false,
  shape = 'square',
  label,
  hint,
  width = 'w-32',
  height = 'h-32',
  onBrowse,
  cropConfig,
  browserFolder,
}: ImageUploadProps) {
  const { t } = useLanguage()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [showBrowser, setShowBrowser] = useState(false)
  const [browseCropSrc, setBrowseCropSrc] = useState<string | null>(null)

  const handleClick = () => {
    if (!uploading) inputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset input so the same file can be selected again
    e.target.value = ''

    setError('')

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(t('upload.invalidType'))
      return
    }

    if (file.size > MAX_SIZE) {
      setError(t('upload.tooLarge'))
      return
    }

    if (cropConfig) {
      const objectUrl = URL.createObjectURL(file)
      setCropSrc(objectUrl)
    } else {
      await onUpload(file)
    }
  }

  const handleCropConfirm = async (croppedFile: File) => {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
    await onUpload(croppedFile)
  }

  const handleCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  const handleBrowseCropConfirm = async (croppedFile: File) => {
    setBrowseCropSrc(null)
    await onUpload(croppedFile)
  }

  const handleBrowseCropCancel = () => {
    setBrowseCropSrc(null)
  }

  const handleBrowseClick = () => {
    if (browserFolder) {
      setShowBrowser(true)
    } else if (onBrowse) {
      onBrowse()
    }
  }

  const roundedClass = shape === 'circle' ? 'rounded-full' : 'rounded-lg'

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">{label}</label>
      )}
      <div className="flex items-center gap-4">
        <div
          onClick={handleClick}
          className={`relative ${width} ${height} ${roundedClass} overflow-hidden cursor-pointer group border-2 border-dashed border-gray-300 dark:border-neutral-600 hover:border-primary-400 transition-colors bg-gray-50 dark:bg-neutral-800`}
        >
          {currentUrl ? (
            <>
              <img
                src={currentUrl}
                alt="Upload preview"
                className="w-full h-full object-cover"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <svg className="w-8 h-8 text-gray-400 dark:text-neutral-500 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          )}

          {/* Upload spinner */}
          {uploading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {currentUrl && onRemove && !uploading && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            title={t('upload.removePhoto')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {(browserFolder || onBrowse) && (
        <button
          type="button"
          onClick={handleBrowseClick}
          className="text-xs text-primary-600 hover:text-primary-700 mt-1 underline"
        >
          {t('upload.browseExisting')}
        </button>
      )}
      {hint && <p className="text-xs text-gray-400 dark:text-neutral-500 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {cropConfig && cropSrc && (
        <CropModal
          isOpen={!!cropSrc}
          imageSrc={cropSrc}
          cropConfig={cropConfig}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}

      {browserFolder && (
        <ImageBrowserModal
          isOpen={showBrowser}
          onClose={() => setShowBrowser(false)}
          onSelect={(url) => {
            setShowBrowser(false)
            if (cropConfig) {
              setBrowseCropSrc(url)
            } else {
              onUpload(new File([], 'browse-placeholder')).catch(() => {})
            }
          }}
          defaultFolder={browserFolder}
        />
      )}

      {cropConfig && browseCropSrc && (
        <CropModal
          isOpen={!!browseCropSrc}
          imageSrc={browseCropSrc}
          cropConfig={cropConfig}
          onConfirm={handleBrowseCropConfirm}
          onCancel={handleBrowseCropCancel}
        />
      )}
    </div>
  )
}
