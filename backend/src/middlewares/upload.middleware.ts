import multer from 'multer'
import { BadRequestError } from '../utils/errors'

const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif','image/svg+xml','image/jpg']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const storage = multer.memoryStorage()

export const uploadSingle = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new BadRequestError('Invalid file type', 'Only JPEG, PNG, WebP, JPG, Svg and GIF images are allowed'))
    }
  },
}).single('image')
