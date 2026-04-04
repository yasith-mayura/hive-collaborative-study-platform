const { v4: uuidv4 } = require('uuid');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const axios = require('axios');
const Course = require('../models/Course');
const Resource = require('../models/Resource');
const { s3Client } = require('../middleware/uploadMiddleware');

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:8000';
const S3_BUCKET = process.env.S3_BUCKET_NAME || 'hive-study-resources';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';

const getAuthorizationHeader = (req) => req.headers.authorization || '';

const getLevelAccessScope = async (req) => {
  if (req.levelAccessScope) return req.levelAccessScope;

  const role = req.user?.role || 'student';
  if (role === 'superadmin') {
    req.levelAccessScope = { hasRestriction: false, level: null };
    return req.levelAccessScope;
  }

  try {
    const response = await axios.get(`${USER_SERVICE_URL}/api/batch-levels/me`, {
      headers: { Authorization: getAuthorizationHeader(req) },
      timeout: 10000,
    });

    const level = Number(response?.data?.level);
    if (!Number.isInteger(level)) {
      throw new Error('Invalid level returned from user-service');
    }

    req.levelAccessScope = {
      hasRestriction: true,
      level,
    };
    return req.levelAccessScope;
  } catch (err) {
    const status = err?.response?.status;
    if (status === 404) {
      const accessError = new Error('No level assignment found for your account');
      accessError.statusCode = 403;
      throw accessError;
    }

    const accessError = new Error('Unable to resolve your level access');
    accessError.statusCode = status || 500;
    throw accessError;
  }
};

const enforceCourseLevelAccess = async (req, course) => {
  const scope = await getLevelAccessScope(req);
  if (!scope.hasRestriction) return;

  const courseLevel = Number(course?.level);
  if (courseLevel !== scope.level) {
    const error = new Error('Forbidden: this course is outside your assigned level');
    error.statusCode = 403;
    throw error;
  }
};

const getAccessibleSubjectCodes = async (req) => {
  const scope = await getLevelAccessScope(req);
  if (!scope.hasRestriction) return null;

  const courses = await Course.find({ isActive: true, level: scope.level }).select('subjectCode').lean();
  return courses.map((course) => course.subjectCode);
};

// GET /resources/subjects  (all authenticated)
const getAllSubjects = async (req, res) => {
  try {
    const scope = await getLevelAccessScope(req);
    const query = { isActive: true };
    if (scope.hasRestriction) query.level = scope.level;

    const courses = await Course.find(query).sort({ level: 1, semester: 1, subjectCode: 1 });
    return res.json({ count: courses.length, courses });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    console.error('[getAllSubjects]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /resources/subjects/:subjectCode  (all authenticated)
const getSubjectById = async (req, res) => {
  try {
    const course = await Course.findOne({ subjectCode: req.params.subjectCode.toUpperCase(), isActive: true });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    await enforceCourseLevelAccess(req, course);

    // Attach resources grouped by type
    const resources = await Resource.find({ subjectCode: course.subjectCode, isActive: true }).select('-__v');
    const grouped = {
      past_papers: resources.filter(r => r.resourceType === 'past_paper'),
      resource_books: resources.filter(r => r.resourceType === 'resource_book'),
      notes: resources.filter(r => r.resourceType === 'note'),
    };

    return res.json({ course, resources: grouped });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    console.error('[getSubjectById]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ═══════════════════════════════════════════════════════════════
//  RESOURCE CONTROLLERS
// ═══════════════════════════════════════════════════════════════

// POST /resources/upload  (admin / superadmin)
const uploadResource = async (req, res) => {
  try {
    // uploadSingle middleware already uploaded the file to S3
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const { subjectCode, resourceType, title } = req.body;

    if (!subjectCode || !resourceType || !title) {
      return res.status(400).json({ message: 'subjectCode, resourceType and title are required' });
    }

    // Verify course exists
    const course = await Course.findOne({ subjectCode: subjectCode.toUpperCase(), isActive: true });
    if (!course) return res.status(404).json({ message: `Course ${subjectCode} not found` });
    await enforceCourseLevelAccess(req, course);

    // Build resource document
    const resource = new Resource({
      resourceId: uuidv4(),
      subjectCode: course.subjectCode,
      subjectName: course.subjectName,
      resourceType,
      title,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      s3Key: req.file.key,         // set by multer-s3
      s3Url: req.file.location,    // set by multer-s3
      uploadedBy: req.user.uid,
      isEmbedded: false,
    });

    await resource.save();

    // ── Notify RAG service to start embedding pipeline ──────────────
    try {
      const ragPayload = {
        resourceId: resource.resourceId,
        subjectCode: resource.subjectCode,
        subjectName: resource.subjectName,
        s3Url: resource.s3Url,
        fileName: resource.fileName,
        resourceType: resource.resourceType,
        uploadedBy: resource.uploadedBy,
      };

      const ragRes = await axios.post(
        `${RAG_SERVICE_URL}/api/rag/ingest`,
        ragPayload,
        { timeout: 120000 }
      );

      if (ragRes.status === 200 || ragRes.status === 202) {
        resource.isEmbedded = true;
        resource.embeddedAt = new Date();
        await resource.save();
        console.log(`[RAG] Embedding triggered for resource ${resource.resourceId}`);
      }
    } catch (ragErr) {
      // Non-fatal — resource is saved, embedding can be retried later
      console.warn(`[RAG] Could not notify RAG service: ${ragErr.message}`);
    }

    return res.status(201).json({
      message: 'Resource uploaded successfully',
      resource,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    console.error('[uploadResource]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /resources/subject/:subjectCode  (all authenticated)
const getResourcesBySubject = async (req, res) => {
  try {
    const subjectCode = req.params.subjectCode.toUpperCase();
    const course = await Course.findOne({ subjectCode, isActive: true });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    await enforceCourseLevelAccess(req, course);

    const resources = await Resource.find({ subjectCode, isActive: true })
      .select('-__v -s3Key')
      .sort({ createdAt: -1 });

    // Group by resourceType
    const grouped = {
      past_papers: resources.filter(r => r.resourceType === 'past_paper'),
      resource_books: resources.filter(r => r.resourceType === 'resource_book'),
      notes: resources.filter(r => r.resourceType === 'note'),
    };

    return res.json({
      course,
      totalResources: resources.length,
      resources: grouped,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    console.error('[getResourcesBySubject]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /resources/:resourceId  (all authenticated)
const getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findOne({ resourceId: req.params.resourceId, isActive: true }).select('-__v -s3Key');
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    const course = await Course.findOne({ subjectCode: resource.subjectCode, isActive: true });
    if (!course) return res.status(404).json({ message: 'Course not found for this resource' });
    await enforceCourseLevelAccess(req, course);

    return res.json(resource);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    console.error('[getResourceById]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /resources/:resourceId/download  (all authenticated)
const downloadResource = async (req, res) => {
  try {
    const resource = await Resource.findOne({ resourceId: req.params.resourceId, isActive: true });
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    const course = await Course.findOne({ subjectCode: resource.subjectCode, isActive: true });
    if (!course) return res.status(404).json({ message: 'Course not found for this resource' });
    await enforceCourseLevelAccess(req, course);

    // Generate pre-signed URL (expires in 1 hour)
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: resource.s3Key,
      ResponseContentDisposition: `attachment; filename="${resource.fileName}"`,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    // Increment download counter (non-blocking)
    Resource.findOneAndUpdate({ resourceId: resource.resourceId }, { $inc: { downloadCount: 1 } }).exec();

    return res.json({
      message: 'Download URL generated (valid for 1 hour)',
      fileName: resource.fileName,
      fileSize: resource.fileSize,
      presignedUrl,
      expiresIn: 3600,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    console.error('[downloadResource]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /resources/:resourceId  (admin / superadmin)
const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findOne({ resourceId: req.params.resourceId });
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    const course = await Course.findOne({ subjectCode: resource.subjectCode, isActive: true });
    if (!course) return res.status(404).json({ message: 'Course not found for this resource' });
    await enforceCourseLevelAccess(req, course);

    // Soft delete in MongoDB
    resource.isActive = false;
    await resource.save();

    // Notify RAG service to remove embeddings (non-fatal if it fails)
    try {
      await axios.delete(
        `${RAG_SERVICE_URL}/api/rag/documents/${resource.resourceId}`,
        { timeout: 30000 }
      );
      console.log(`[RAG] Embeddings deletion requested for ${resource.resourceId}`);
    } catch (ragErr) {
      console.warn(`[RAG] Could not delete embeddings: ${ragErr.message}`);
    }

    return res.json({
      message: 'Resource deleted successfully',
      resourceId: resource.resourceId,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    console.error('[deleteResource]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /resources/stats  (admin / superadmin)
const getResourceStats = async (req, res) => {
  try {
    const accessibleSubjectCodes = await getAccessibleSubjectCodes(req);
    const matchFilter = { isActive: true };
    if (accessibleSubjectCodes) {
      matchFilter.subjectCode = { $in: accessibleSubjectCodes };
    }

    const [
      totalResources,
      embeddedCount,
      byType,
      bySubject,
      topDownloaded,
    ] = await Promise.all([
      // Total active resources
      Resource.countDocuments(matchFilter),

      // Embedded count
      Resource.countDocuments({ ...matchFilter, isEmbedded: true }),

      // Count by resource type
      Resource.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$resourceType', count: { $sum: 1 }, totalDownloads: { $sum: '$downloadCount' } } },
        { $sort: { count: -1 } },
      ]),

      // Downloads per subject
      Resource.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: '$subjectCode',
            subjectName: { $first: '$subjectName' },
            resourceCount: { $sum: 1 },
            totalDownloads: { $sum: '$downloadCount' },
          }
        },
        { $sort: { totalDownloads: -1 } },
      ]),

      // Top 5 most downloaded
      Resource.find(matchFilter)
        .sort({ downloadCount: -1 })
        .limit(5)
        .select('resourceId title fileName subjectCode subjectName resourceType downloadCount'),
    ]);

    return res.json({
      totalResources,
      embeddedCount,
      pendingEmbedding: totalResources - embeddedCount,
      byType,
      bySubject,
      topDownloaded,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    console.error('[getResourceStats]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  // Courses
  getAllSubjects,
  getSubjectById,
  // Resources
  uploadResource,
  getResourcesBySubject,
  getResourceById,
  downloadResource,
  deleteResource,
  getResourceStats,
};
