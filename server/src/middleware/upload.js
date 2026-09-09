import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { isCloudinaryConfigured, getCloudinary } from '../config/cloudinary.js';

const uploadRoot = path.isAbsolute(env.uploadDir)
  ? env.uploadDir
  : path.join(process.cwd(), env.uploadDir);

if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/x-icon',
  'image/vnd.microsoft.icon',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.query.folder || 'general';
    const dest = path.join(uploadRoot, String(folder).replace(/[^a-zA-Z0-9_-]/g, ''));
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(new ApiError(400, 'File type not allowed'));
  }
  cb(null, true);
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
});

export async function maybeUploadToCloudinary(file, folder = 'tms') {
  if (!isCloudinaryConfigured()) return null;
  const cloudinary = await getCloudinary();
  const result = await cloudinary.uploader.upload(file.path, {
    folder: `tms/${folder}`,
    resource_type: 'auto',
  });
  return {
    url: result.secure_url,
    publicId: result.public_id,
    provider: 'cloudinary',
  };
}

export function localFileUrl(file) {
  const relative = path.relative(uploadRoot, file.path).replace(/\\/g, '/');
  return `/uploads/${relative}`;
}
