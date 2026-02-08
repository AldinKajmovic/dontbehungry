'use client'

import { useState, useEffect, useCallback } from 'react'
import { Modal, Button, Alert } from '@/components/ui'
import { adminService } from '@/services/admin'
import { GCSImage } from '@/services/admin/types'
import { useLanguage } from '@/hooks/useLanguage'

interface ImageBrowserModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (url: string) => void
  defaultFolder?: string
}

const FOLDER_OPTIONS = ['restaurants', 'menu-items', 'categories', 'avatars'] as const

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ImageBrowserModal({ isOpen, onClose, onSelect, defaultFolder }: ImageBrowserModalProps) {
  const { t } = useLanguage()
  const [images, setImages] = useState<GCSImage[]>([])
  const [folder, setFolder] = useState(defaultFolder || '')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadImages = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await adminService.browseImages(folder || undefined)
      setImages(result.images)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load images')
    } finally {
      setIsLoading(false)
    }
  }, [folder])

  useEffect(() => {
    if (isOpen) {
      setFolder(defaultFolder || '')
      setSearch('')
      loadImages()
    }
  }, [isOpen, defaultFolder])

  useEffect(() => {
    if (isOpen) {
      loadImages()
    }
  }, [folder, isOpen, loadImages])

  const filteredImages = search
    ? images.filter((img) => img.name.toLowerCase().includes(search.toLowerCase()))
    : images

  const handleSelect = (url: string) => {
    onSelect(url)
    onClose()
  }

  const folderLabel = (f: string) => {
    const map: Record<string, string> = {
      restaurants: t('admin.imageBrowser.restaurants'),
      'menu-items': t('admin.imageBrowser.menuItems'),
      categories: t('admin.imageBrowser.categories'),
      avatars: t('admin.imageBrowser.avatars'),
    }
    return map[f] || f
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('admin.imageBrowser.title')} size="lg">
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex gap-3">
          <select
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
          >
            <option value="">{t('admin.imageBrowser.allFolders')}</option>
            {FOLDER_OPTIONS.map((f) => (
              <option key={f} value={f}>{folderLabel(f)}</option>
            ))}
          </select>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.imageBrowser.searchPlaceholder')}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>

        {/* Count */}
        <p className="text-xs text-gray-500">
          {t('admin.imageBrowser.count', { count: filteredImages.length })}
        </p>

        {/* Error */}
        {error && <Alert type="error">{error}</Alert>}

        {/* Image Grid */}
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {t('admin.imageBrowser.empty')}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {filteredImages.map((img) => (
                <button
                  key={img.name}
                  type="button"
                  onClick={() => handleSelect(img.url)}
                  className="group relative rounded-lg overflow-hidden border-2 border-gray-200 hover:border-primary-500 transition-colors bg-gray-50 aspect-square"
                  title={img.name}
                >
                  <img
                    src={img.url}
                    alt={img.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Hover info overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-white">
                    <p className="text-xs truncate w-full text-center">{img.name.split('/').pop()}</p>
                    <p className="text-xs mt-1">{formatFileSize(img.size)}</p>
                    {img.created && (
                      <p className="text-xs mt-0.5">{new Date(img.created).toLocaleDateString()}</p>
                    )}
                    <span className="mt-2 text-xs font-medium bg-primary-500 px-2 py-0.5 rounded">
                      {t('admin.imageBrowser.select')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Close */}
        <div className="flex justify-end pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="!w-auto !px-6">
            {t('common.close')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
