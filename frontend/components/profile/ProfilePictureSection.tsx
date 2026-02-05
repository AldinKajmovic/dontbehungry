'use client'

import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'
import { Button, Section } from '@/components/ui'

export function ProfilePictureSection() {
  const { user } = useAuth()
  const { t } = useLanguage()

  if (!user) return null

  return (
    <Section title={t('profile.profilePicture')}>
      <div className="flex items-center gap-6">
        <div className="relative">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={`${user.firstName}'s avatar`}
              className="w-24 h-24 rounded-full object-cover border-4 border-gray-100"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-100">
              <span className="text-3xl font-bold text-gray-400">
                {user.firstName[0]}{user.lastName[0]}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-3">
            Upload a new profile picture. Recommended size: 200x200px.
          </p>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="!py-2 !px-4 text-sm"
              disabled
            >
              Upload Photo
            </Button>
            {user.avatarUrl && (
              <Button
                type="button"
                variant="secondary"
                className="!py-2 !px-4 text-sm text-red-600 hover:text-red-700"
                disabled
              >
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Photo upload coming soon
          </p>
        </div>
      </div>
    </Section>
  )
}
