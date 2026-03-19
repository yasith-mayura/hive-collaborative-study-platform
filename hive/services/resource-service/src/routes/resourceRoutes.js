const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { uploadSingle } = require('../middleware/uploadMiddleware');
const {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  uploadResource,
  getResourcesBySubject,
  getResourceById,
  downloadResource,
  deleteResource,
  getResourceStats,
} = require('../controllers/resourceController');

// ── Subject routes ──────────────────────────────────────────────────────────

// POST   /resources/subjects            → admin / superadmin
router.post('/subjects', authMiddleware, requireRole('admin', 'superadmin'), createSubject);

// GET    /resources/subjects            → all authenticated
router.get('/subjects', authMiddleware, getAllSubjects);

// ⚠ /stats must be registered BEFORE /subjects/:subjectId and /:resourceId
//   to avoid Express treating "stats" as a URL param

// GET    /resources/stats               → admin / superadmin
router.get('/stats', authMiddleware, requireRole('admin', 'superadmin'), getResourceStats);

// GET    /resources/subjects/:subjectCode → all authenticated
router.get('/subjects/:subjectCode', authMiddleware, getSubjectById);

// PUT    /resources/subjects/:subjectCode → admin / superadmin
router.put('/subjects/:subjectCode', authMiddleware, requireRole('admin', 'superadmin'), updateSubject);

// DELETE /resources/subjects/:subjectCode → superadmin only
router.delete('/subjects/:subjectCode', authMiddleware, requireRole('superadmin'), deleteSubject);

// ── Resource routes ─────────────────────────────────────────────────────────

// POST   /resources/upload              → admin / superadmin  (multer-s3 handles S3 upload)
router.post('/upload', authMiddleware, requireRole('admin', 'superadmin'), uploadSingle, uploadResource);

// GET    /resources/subject/:subjectCode  → all authenticated
router.get('/subject/:subjectCode', authMiddleware, getResourcesBySubject);

// GET    /resources/:resourceId/download → all authenticated
router.get('/:resourceId/download', authMiddleware, downloadResource);

// GET    /resources/:resourceId         → all authenticated
router.get('/:resourceId', authMiddleware, getResourceById);

// DELETE /resources/:resourceId         → admin / superadmin
router.delete('/:resourceId', authMiddleware, requireRole('admin', 'superadmin'), deleteResource);

module.exports = router;
