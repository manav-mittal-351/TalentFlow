// ─── middleware/uploadResume.js ────────────────────────────────────────────────
// Multer configuration for resume file uploads.
// Doc reference: Document 5 — API Design §9 (POST /users/resume)
//                Document 5 §4 Error Codes: FILE_TOO_LARGE, INVALID_FILE_TYPE
//
// Rules (documented):
//   - Allowed types: PDF, DOCX only
//   - Max size: 5MB
//   - Storage: local uploads/resumes/ in V1 (V2 → Cloudinary)
//   - Filename: <userId>-<timestamp>.<ext>  — prevents collisions & overwrites
//
// Usage:
//   router.post('/apply/:jobId', verifyToken, uploadResume.single('resume'), controller)
//
// After multer runs:
//   req.file.path → relative path stored as resumeUrl in Application document

import multer   from 'multer';
import path     from 'path';
import fs       from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Ensure uploads directory exists ──────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '../../uploads/resumes');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ─── Storage configuration ────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOAD_DIR);
  },

  filename(req, file, cb) {
    const userId    = req.user?.id ?? 'unknown';
    const timestamp = Date.now();
    const ext       = path.extname(file.originalname).toLowerCase();
    // e.g. 6a527e9d-1720781234567.pdf
    cb(null, `${userId}-${timestamp}${ext}`);
  },
});

// ─── File filter — PDF / DOCX only ────────────────────────────────────────────
const ALLOWED_MIMETYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx']);

const fileFilter = (_req, file, cb) => {
  const ext      = path.extname(file.originalname).toLowerCase();
  const mimeOk   = ALLOWED_MIMETYPES.has(file.mimetype);
  const extOk    = ALLOWED_EXTENSIONS.has(ext);

  if (mimeOk && extOk) {
    cb(null, true);
  } else {
    const err = new Error('Only PDF and DOCX files are allowed');
    err.statusCode = 400;
    err.errorCode  = 'INVALID_FILE_TYPE';
    cb(err, false);
  }
};

// ─── Multer instance ──────────────────────────────────────────────────────────
// limits.fileSize: 5MB = 5 * 1024 * 1024 bytes
const uploadResume = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ─── MulterError handler ───────────────────────────────────────────────────────
// Wraps multer middleware to convert MulterError into documented error shape.
// Call this instead of uploadResume.single() directly in routes.
export const handleResumeUpload = (req, res, next) => {
  uploadResume.single('resume')(req, res, (err) => {
    if (!err) return next();

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success:   false,
        message:   'Resume file exceeds the 5MB size limit',
        errorCode: 'FILE_TOO_LARGE',
      });
    }

    // INVALID_FILE_TYPE from fileFilter above, or any other multer error
    return res.status(err.statusCode || 400).json({
      success:   false,
      message:   err.message || 'File upload failed',
      errorCode: err.errorCode || 'VALIDATION_ERROR',
    });
  });
};

export default uploadResume;
