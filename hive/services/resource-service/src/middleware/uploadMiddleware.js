const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');

// ── S3 Client ──────────────────────────────────────────────────────────────
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// ── File filter — PDFs only ────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(
      Object.assign(new Error('Only PDF files are allowed'), { code: 'INVALID_FILE_TYPE' }),
      false
    );
  }
};

// ── multer-s3 storage ──────────────────────────────────────────────────────
const s3Storage = multerS3({
  s3: s3Client,
  bucket: process.env.S3_BUCKET_NAME || 'hive-study-resources',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: (req, file, cb) => {
    cb(null, {
      uploadedBy: req.user?.uid || 'unknown',
      subjectCode: req.body.subjectCode || 'unknown',
      resourceType: req.body.resourceType || 'unknown',
    });
  },
  key: (req, file, cb) => {
    const subjectCode = (req.body.subjectCode || 'general').toUpperCase();
    const resourceType = (req.body.resourceType || 'misc');
    const timestamp = Date.now();
    // Sanitize original filename (remove spaces / special chars)
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const s3Key = `resources/${subjectCode}/${resourceType}/${timestamp}-${safeName}`;
    cb(null, s3Key);
  },
});

// ── Multer instance ─────────────────────────────────────────────────────────
const upload = multer({
  storage: s3Storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
  },
});

// Export single-file upload middleware (field name: "file")
const uploadSingle = upload.single('file');

module.exports = { uploadSingle, s3Client };
