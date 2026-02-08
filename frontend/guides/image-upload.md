# Image Upload — Frontend Guide

## Overview

Image uploads use a reusable `ImageUpload` component and the `profileService.uploadImage()` / `profileService.deleteImage()` methods. All images are uploaded to GCS via the backend API and returned as public URLs.

## ImageUpload Component

```tsx
import { ImageUpload } from '@/components/ui'

<ImageUpload
  currentUrl={imageUrl || null}
  onUpload={handleUpload}
  onRemove={handleRemove}
  uploading={isUploading}
  shape="square"        // 'square' | 'circle' (circle for avatars)
  label="Image"
  hint="(optional)"
  width="w-24"
  height="h-24"
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `currentUrl` | `string \| null` | — | Existing image URL to display |
| `onUpload` | `(file: File) => Promise<string \| null>` | — | Upload handler, returns URL on success |
| `onRemove` | `() => void` | — | Called when user clicks delete |
| `uploading` | `boolean` | `false` | Shows spinner overlay |
| `shape` | `'square' \| 'circle'` | `'square'` | Circle for avatars |
| `label` | `string` | — | Label text above the component |
| `hint` | `string` | — | Hint text next to label |
| `width` | `string` | `'w-24'` | Tailwind width class |
| `height` | `string` | `'h-24'` | Tailwind height class |
| `cropConfig` | `CropConfig` | — | When set, shows crop modal before upload (see [image-crop.md](./image-crop.md)) |

### Client-side validation
- Max 5MB file size
- Image MIME types only (jpeg, png, webp, gif)

### Client-side cropping

The `ImageUpload` component accepts an optional `cropConfig` prop. When provided, a crop modal appears between file selection and upload. See [image-crop.md](./image-crop.md) for full details.

```tsx
import { ImageUpload, CROP_CONFIGS } from '@/components/ui'

<ImageUpload cropConfig={CROP_CONFIGS.avatar} ... />
```

## Profile Service Methods

```typescript
// Upload an image
const { url } = await profileService.uploadImage(file, 'avatar')
const { url } = await profileService.uploadImage(file, 'restaurant-logo', restaurantId)

// Delete an image from GCS
await profileService.deleteImage(url)
```

### Upload Types

| Type | Use Case |
|------|----------|
| `avatar` | User profile pictures |
| `restaurant-logo` | Restaurant logo (gallery[0]) |
| `restaurant-cover` | Restaurant cover image (gallery[1]) |
| `restaurant-gallery` | Restaurant gallery images (gallery[2-5]) |
| `menu-item` | Menu item images |
| `category-icon` | Category icons |

## Usage Patterns

### Simple Upload (avatar, menu item, category icon)

```tsx
const [imageUploading, setImageUploading] = useState(false)

const handleUpload = async (file: File): Promise<string | null> => {
  setImageUploading(true)
  try {
    const { url } = await profileService.uploadImage(file, 'avatar')
    setFormData(prev => ({ ...prev, avatarUrl: url }))
    toast.success(t('upload.success'))
    return url
  } catch {
    toast.error(t('upload.failed'))
    return null
  } finally {
    setImageUploading(false)
  }
}

const handleRemove = () => {
  if (formData.avatarUrl?.startsWith('https://storage.googleapis.com/')) {
    profileService.deleteImage(formData.avatarUrl).catch(() => {})
  }
  setFormData(prev => ({ ...prev, avatarUrl: '' }))
}
```

### Restaurant Gallery (hidden file input pattern)

Restaurants use a gallery with `images[]` array where:
- `images[0]` = Logo (`restaurant-logo` type)
- `images[1]` = Cover (`restaurant-cover` type)
- `images[2-5]` = Gallery images (`restaurant-gallery` type)

```tsx
const imageInputRef = useRef<HTMLInputElement>(null)

const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return
  e.target.value = ''
  setImageUploading(true)
  try {
    const type = form.images.length === 0 ? 'restaurant-logo' : 'restaurant-cover'
    const { url } = await profileService.uploadImage(file, type, restaurantId)
    setForm(prev => ({ ...prev, images: [...prev.images, url] }))
  } catch {
    toast.error(t('upload.failed'))
  } finally {
    setImageUploading(false)
  }
}

// In JSX:
<input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
<button onClick={() => imageInputRef.current?.click()}>Add Image</button>
```

## Where Uploads Are Wired

| Location | Component | Type |
|----------|-----------|------|
| Profile avatar | `ProfilePictureSection.tsx` | `avatar` |
| Profile restaurant gallery | `useRestaurants.ts` + `RestaurantFormModal.tsx` | `restaurant-logo`, `restaurant-cover`, `restaurant-gallery` |
| Profile menu item | `useMenuItems.ts` + `MenuItemFormModal.tsx` | `menu-item` |
| Admin restaurants | `panel/restaurants/page.tsx` | `restaurant-logo`, `restaurant-cover`, `restaurant-gallery` |
| Admin menu items | `panel/menu-items/page.tsx` | `menu-item` |
| Admin categories | `panel/categories/page.tsx` | `category-icon` |
| Admin users | `panel/users/page.tsx` | `avatar` |

## Admin Image Browser

The `ImageBrowserModal` allows admins to browse and reuse already-uploaded GCS images instead of uploading new ones.

```tsx
import { ImageBrowserModal } from '@/components/admin/ImageBrowserModal'

<ImageBrowserModal
  isOpen={showImageBrowser}
  onClose={() => setShowImageBrowser(false)}
  onSelect={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
  defaultFolder="menu-items"
/>
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `isOpen` | `boolean` | Whether modal is visible |
| `onClose` | `() => void` | Close handler |
| `onSelect` | `(url: string) => void` | Called with selected image URL |
| `defaultFolder` | `string` | Pre-selected folder filter (`restaurants`, `menu-items`, `categories`, `avatars`) |

### Integration with ImageUpload

The `ImageUpload` component accepts an optional `onBrowse` prop. When provided, a "Browse existing" link appears below the upload area:

```tsx
<ImageUpload
  currentUrl={formData.imageUrl || null}
  onUpload={handleUpload}
  onRemove={handleRemove}
  uploading={isUploading}
  onBrowse={() => setShowImageBrowser(true)}
/>
```

### Integration with Restaurant Gallery

For the restaurant gallery (which uses `images[]` and a hidden file input), add a "Browse existing" button next to the gallery hint and wire `onSelect` to append to the images array.

### Localization Keys
- `admin.imageBrowser.*` — modal title, folder labels, search, empty state, count, warning
- `upload.browseExisting` — "Browse existing" link text

## Localization Keys

All upload-related text uses keys under `upload.*` namespace:
- `upload.success`, `upload.failed`, `upload.uploading`
- `upload.tooLarge`, `upload.invalidType`
- `upload.galleryHint` — shown in restaurant gallery forms
- `upload.browseExisting` — shown in admin pages with image browser
