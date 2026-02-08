# Image Upload API

## Overview

The image upload system uses Google Cloud Storage (GCS) for file storage with public read access. Images are optimized using `sharp` (resized + converted to WebP) before upload.

## Endpoints

### Upload Image

```
POST /api/upload?type=<type>[&entityId=<id>]
```

**Auth**: Required (JWT)
**Rate Limit**: 30 requests / 15 minutes
**Content-Type**: `multipart/form-data`
**Field**: `image` (single file)

**Query Parameters**:
| Param | Required | Description |
|-------|----------|-------------|
| `type` | Yes | One of: `avatar`, `restaurant-logo`, `restaurant-cover`, `restaurant-gallery`, `menu-item`, `category-icon` |
| `entityId` | For restaurant types | The restaurant ID (used in GCS path) |

**Response**: `201 { url: string }`

The returned URL is a full public GCS URL (e.g., `https://storage.googleapis.com/bucket/path/file.webp`).

### Delete Image

```
DELETE /api/upload
```

**Auth**: Required (JWT)
**Rate Limit**: 30 requests / 15 minutes
**Body**: `{ url: string }`

**Response**: `200 { message: "Image deleted" }`

## Image Types & Dimensions

| Type | Width | Height | Fit | Quality | Output |
|------|-------|--------|-----|---------|--------|
| `avatar` | 400 | 400 | cover | 80 | webp |
| `restaurant-logo` | 400 | 400 | cover | 80 | webp |
| `restaurant-cover` | 1200 | 600 | cover | 80 | webp |
| `restaurant-gallery` | 1200 | 800 | inside | 80 | webp |
| `menu-item` | 800 | 600 | inside | 80 | webp |
| `category-icon` | 200 | 200 | cover | 80 | webp |

## Validation

- **Max file size**: 5MB
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/jpg`, `image/svg+xml`
- Validated both by multer middleware and the image utility

## GCS Path Structure

```
avatars/{userId}/{uuid}.webp
restaurants/{entityId}/{uuid}.webp
menu-items/{uuid}.webp
categories/{uuid}.webp
```

## Old Image Cleanup

When an entity's image is replaced (avatar, logoUrl, coverUrl, imageUrl, iconUrl), the old GCS object is deleted fire-and-forget if it's a GCS URL (starts with `https://storage.googleapis.com/`). This happens in:

- `user.service.ts` — avatar update
- `restaurant.service.ts` — logoUrl/coverUrl update, gallery image cleanup on update (profile + admin)
- `menuItem.service.ts` — imageUrl update (profile + admin)
- `categories.service.ts` — iconUrl update (admin)

## Security

- All uploads require authentication
- Rate limited to prevent abuse
- Path traversal protection on delete (rejects `..` and leading `/`)
- Memory storage (no untrusted files written to disk)
- EXIF metadata stripped during optimization

## Environment Variables

```
GCS_BUCKET_NAME=your-bucket-name
GCS_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

Service account needs `roles/storage.objectAdmin` on the bucket.

## Admin Image Browser

### Browse Images Endpoint

```
GET /api/admin/images/browse?folder=<folder>
```

**Auth**: Admin only (authenticate + adminOnly + ipWhitelist + adminLimiter)

**Query Parameters**:
| Param | Required | Description |
|-------|----------|-------------|
| `folder` | No | One of: `restaurants`, `menu-items`, `categories`, `avatars`. Omit for all folders. |

**Response**: `200 { images: GCSImage[], total: number }`

Each `GCSImage` contains: `name`, `url`, `size`, `contentType`, `created`, `folder`.

### Security
- Folder parameter validated against a whitelist — no arbitrary GCS prefix access
- Path traversal blocked (rejects `..` and leading `/`)
- Max 500 results to prevent memory/response size issues

### Caveat: Shared Image Deletion
When an entity's image is replaced, the old GCS file is deleted. If two entities share the same image URL (via the browse feature) and one entity changes its image, the other entity's image will break. This is acceptable for admin testing use and is documented in the UI with a warning banner.

### Key Files
- `src/lib/gcs.ts` — `listGCSImages()` function
- `src/services/admin/images.service.ts` — `browseImages()` with folder whitelist
- `src/controllers/admin.controller.ts` — `browseImages` handler
- `src/routes/admin.routes.ts` — `GET /images/browse` route

## Key Files

- `src/lib/gcs.ts` — GCS client (upload, delete, extract path, list images)
- `src/utils/image.ts` — Sharp optimization, validation
- `src/middlewares/upload.middleware.ts` — Multer memory storage config
- `src/controllers/upload.controller.ts` — Upload/delete handlers
- `src/routes/upload.routes.ts` — Route definitions
- `src/services/admin/images.service.ts` — Admin image browser service
