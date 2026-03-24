require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./src/config/db');
const resourceRoutes = require('./src/routes/resourceRoutes');

const PORT = process.env.PORT || 3002;

// Connect to MongoDB
connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/hive');

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

// ── Health check (public) ────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({
  status: 'OK',
  service: 'resource-service',
  s3Bucket: process.env.S3_BUCKET_NAME || 'hive-study-resources',
  timestamp: new Date().toISOString(),
}));

app.get('/', (req, res) => res.json({
  status: 'OK',
  service: 'resource-service',
  version: '1.0.0',
  endpoints: {
    subjects: '/resources/subjects',
    upload: 'POST /resources/upload',
    resources: '/resources/subject/:subjectCode',
    download: '/resources/:resourceId/download',
    stats: '/resources/stats',
  },
}));

// ── Resource routes ──────────────────────────────────────────────────────────
app.use('/resources', resourceRoutes);

// ── Multer / upload error handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
  // Wrong file type (set in uploadMiddleware fileFilter)
  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({ message: err.message });
  }
  // File too large
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large. Maximum size is 50MB' });
  }
  // Multer field errors
  if (err.code && err.code.startsWith('LIMIT_')) {
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  // Generic fallback
  console.error('[Server Error]', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('  S3 Bucket : ' + (process.env.S3_BUCKET_NAME || 'hive-study-resources'));
  console.log('  RAG URL   : ' + (process.env.RAG_SERVICE_URL || 'http://localhost:8000'));
  console.log('  MongoDB   : ' + (process.env.MONGO_URI || 'mongodb://localhost:27017/hive'));
});
