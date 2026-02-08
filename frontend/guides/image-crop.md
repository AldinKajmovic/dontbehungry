# Image Crop — Frontend Guide

## Overview

Client-side image cropping is integrated between file selection and upload. Users can pan, zoom, and crop images before they are sent to the backend. The backend still performs final resize + WebP conversion via Sharp.

## Dependencies

- `react-easy-crop` — lightweight React cropper with circle/rect support, zoom, and pan

## Core Files

| File | Purpose |
|------|---------|
| `components/ui/cropUtils.ts` | `CropArea`/`CropConfig` interfaces, `CROP_CONFIGS` constant, `getCroppedImageFile()` |
| `components/ui/CropModal.tsx` | Modal with `<Cropper>`, zoom slider, cancel/apply buttons |
| `components/ui/ImageUpload.tsx` | Optional `cropConfig` prop triggers crop modal before upload |

## CropConfig

Each image type maps to a predefined crop configuration:

| Key | Aspect | Shape |
|-----|--------|-------|
| `avatar` | 1:1 | round |
| `restaurant-logo` | 1:1 | rect |
| `restaurant-cover` | 2:1 | rect |
| `restaurant-gallery` | 3:2 | rect |
| `menu-item` | 4:3 | rect |
| `category-icon` | 1:1 | rect |

```ts
import { CROP_CONFIGS } from '@/components/ui'

// Use in ImageUpload:
<ImageUpload cropConfig={CROP_CONFIGS.avatar} ... />
```

## CropModal Props

| Prop | Type | Description |
|------|------|-------------|
| `isOpen` | `boolean` | Controls visibility |
| `imageSrc` | `string` | Object URL of selected file |
| `cropConfig` | `CropConfig` | Aspect ratio and shape |
| `onConfirm` | `(file: File) => void` | Called with cropped JPEG file |
| `onCancel` | `() => void` | Called when user cancels |

The modal uses `z-[60]` to sit above existing z-50 modals.

## Integration with ImageUpload

Pass `cropConfig` to `ImageUpload` and it automatically shows the crop modal:

```tsx
<ImageUpload
  currentUrl={formData.imageUrl}
  onUpload={handleUpload}
  onRemove={handleRemove}
  uploading={isUploading}
  cropConfig={CROP_CONFIGS['menu-item']}
/>
```

When `cropConfig` is set:
1. User selects a file
2. File is validated (type + size)
3. Object URL is created and crop modal opens
4. User adjusts crop area and clicks Apply
5. `getCroppedImageFile()` draws on canvas, produces a JPEG `File`
6. `onUpload(croppedFile)` is called
7. Object URL is revoked

## Browse Existing Images + Crop

When using `ImageBrowserModal` (admin pages), the selected URL is routed through the crop modal before being used. The flow is:

1. User clicks "Browse existing" in ImageUpload
2. `ImageBrowserModal` opens, user selects an image
3. Instead of setting the URL directly, `cropSrc` is set to the selected URL
4. `CropModal` opens with the existing image
5. User crops, `getCroppedImageFile()` produces a new JPEG `File`
6. File is re-uploaded via the upload handler, producing a fresh URL
7. Fresh URL is set in form state

```tsx
<ImageBrowserModal
  isOpen={showImageBrowser}
  onClose={() => setShowImageBrowser(false)}
  onSelect={(url) => {
    setShowImageBrowser(false)
    setBrowseCropSrc(url)
  }}
/>

{browseCropSrc && (
  <CropModal
    isOpen={!!browseCropSrc}
    imageSrc={browseCropSrc}
    cropConfig={CROP_CONFIGS['menu-item']}
    onConfirm={async (file) => {
      setBrowseCropSrc(null)
      await handleImageUpload(file)
    }}
    onCancel={() => setBrowseCropSrc(null)}
  />
)}
```

## Custom Integration (ProfilePictureSection, Restaurant Gallery)

For components that don't use `ImageUpload` (e.g., profile avatar, restaurant galleries with hidden file inputs):

```tsx
import { CropModal, CROP_CONFIGS } from '@/components/ui'

const [cropSrc, setCropSrc] = useState<string | null>(null)

// On file select:
setCropSrc(URL.createObjectURL(file))

// Render:
{cropSrc && (
  <CropModal
    isOpen={!!cropSrc}
    imageSrc={cropSrc}
    cropConfig={CROP_CONFIGS.avatar}
    onConfirm={handleCropConfirm}
    onCancel={handleCropCancel}
  />
)}
```

## Where Crop Is Wired

| Location | Config |
|----------|--------|
| `ProfilePictureSection.tsx` | `avatar` |
| `useRestaurants.ts` + `RestaurantSection.tsx` | `restaurant-logo`, `restaurant-cover`, `restaurant-gallery` |
| `panel/restaurants/page.tsx` | `restaurant-logo`, `restaurant-cover`, `restaurant-gallery` |
| `panel/categories/page.tsx` | `category-icon` |
| `panel/menu-items/page.tsx` | `menu-item` |
| `panel/users/page.tsx` | `avatar` |
| `MenuItemFormModal.tsx` | `menu-item` |

## Localization Keys

Keys under `crop.*` namespace:
- `crop.title` — "Crop Image"
- `crop.instruction` — "Drag to reposition, use the slider to zoom"
- `crop.zoom` — "Zoom"
- `crop.confirm` — "Apply Crop"

## getCroppedImageFile

Utility that takes an image source URL and a pixel-based crop area, draws it on a `<canvas>`, and returns a JPEG `File` at 95% quality.

```ts
import { getCroppedImageFile, CropArea } from '@/components/ui/cropUtils'

const file: File = await getCroppedImageFile(imageSrc, cropAreaPixels)
```
