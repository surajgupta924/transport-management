import { Router } from 'express';
import path from 'path';
import { authenticate } from '../../middleware/auth.js';
import { upload, maybeUploadToCloudinary, localFileUrl } from '../../middleware/upload.js';
import { asyncHandler } from '../../utils/ApiError.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import { env } from '../../config/env.js';

const router = Router();
router.use(authenticate);

router.post(
  '/',
  upload.array('files', 10),
  asyncHandler(async (req, res) => {
    const files = req.files || [];
    if (!files.length) {
      return sendSuccess(res, { status: 400, message: 'No files uploaded', data: [] });
    }

    const folder = req.query.folder || 'general';
    const results = [];

    for (const file of files) {
      const cloud = await maybeUploadToCloudinary(file, folder);
      results.push({
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: cloud?.url || localFileUrl(file),
        provider: cloud?.provider || 'local',
        publicId: cloud?.publicId,
        path: cloud ? undefined : path.relative(
          path.isAbsolute(env.uploadDir) ? env.uploadDir : path.join(process.cwd(), env.uploadDir),
          file.path
        ),
      });
    }

    return sendSuccess(res, { status: 201, message: 'Files uploaded', data: results });
  })
);

export default router;
