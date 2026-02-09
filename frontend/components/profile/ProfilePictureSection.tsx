'use client'

import { useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'
import { useToast } from '@/hooks/useToast'
import { Button, Section, CropModal, CROP_CONFIGS } from '@/components/ui'
import { profileService } from '@/services/profile'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export function ProfilePictureSection() {
  const { user, refreshUser } = useAuth()
  const { t } = useLanguage()
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [cropSrc, setCropSrc] = useState<string | null>(null)

  if (!user) return null

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(t('upload.invalidType'))
      return
    }
    if (file.size > MAX_SIZE) {
      toast.error(t('upload.tooLarge'))
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setCropSrc(objectUrl)
  }

  const handleCropConfirm = async (croppedFile: File) => {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)

    setUploading(true)
    try {
      const { url } = await profileService.uploadImage(croppedFile, 'avatar')
      await profileService.updateAvatar({ avatarUrl: url })
      await refreshUser()
      toast.success(t('upload.success'))
    } catch {
      toast.error(t('upload.failed'))
    } finally {
      setUploading(false)
    }
  }

  const handleCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  const handleRemove = async () => {
    setUploading(true)
    try {
      const oldUrl = user.avatarUrl
      await profileService.updateAvatar({ avatarUrl: null })
      if (oldUrl) {
        profileService.deleteImage(oldUrl).catch(() => {})
      }
      await refreshUser()
      toast.success(t('upload.removed'))
    } catch {
      toast.error(t('upload.removeFailed'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <Section title={t('profile.profilePicture')}>
      <div className="flex items-center gap-6">
        <div className="relative">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={`${user.firstName}'s avatar`}
              className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 dark:border-neutral-800"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-neutral-700 flex items-center justify-center border-4 border-gray-100 dark:border-neutral-800">
              <span className="text-3xl font-bold text-gray-400 dark:text-neutral-500">
                {user.firstName[0]}{user.lastName[0]}
              </span>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 rounded-full bg-white/70 dark:bg-neutral-900/70 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-neutral-400 mb-3">
            {t('upload.maxSize')}
          </p>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="!py-2 !px-4 text-sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? t('upload.uploading') : (user.avatarUrl ? t('upload.changePhoto') : t('upload.uploadPhoto'))}
            </Button>
            {user.avatarUrl && (
              <Button
                type="button"
                variant="secondary"
                className="!py-2 !px-4 text-sm text-red-600 hover:text-red-700"
                disabled={uploading}
                onClick={handleRemove}
              >
                {t('upload.removePhoto')}
              </Button>
            )}
          </div>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      {cropSrc && (
        <CropModal
          isOpen={!!cropSrc}
          imageSrc={cropSrc}
          cropConfig={CROP_CONFIGS.avatar}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </Section>
  )
}
