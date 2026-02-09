'use client'

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { useLanguage } from '@/hooks/useLanguage'
import { Button } from './Button'
import { getCroppedImageFile, CropConfig, CropArea } from './cropUtils'

interface CropModalProps {
  isOpen: boolean
  imageSrc: string
  cropConfig: CropConfig
  onConfirm: (croppedFile: File) => void
  onCancel: () => void
}

export function CropModal({ isOpen, imageSrc, cropConfig, onConfirm, onCancel }: CropModalProps) {
  const { t } = useLanguage()
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null)
  const [applying, setApplying] = useState(false)

  const onCropComplete = useCallback((_: unknown, croppedPixels: CropArea) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  const handleApply = async () => {
    if (!croppedAreaPixels || applying) return
    setApplying(true)
    try {
      const file = await getCroppedImageFile(imageSrc, croppedAreaPixels)
      onConfirm(file)
    } catch {
      onCancel()
    } finally {
      setApplying(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('crop.title')}</h3>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">{t('crop.instruction')}</p>
        </div>

        {/* Cropper area */}
        <div className="relative w-full h-72 bg-gray-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={cropConfig.aspect}
            cropShape={cropConfig.shape}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Zoom slider */}
        <div className="px-6 py-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
            {t('crop.zoom')}
          </label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-primary-600"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-5">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onCancel}
            disabled={applying}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={handleApply}
            isLoading={applying}
            disabled={applying}
          >
            {t('crop.confirm')}
          </Button>
        </div>
      </div>
    </div>
  )
}
