const { v4: uuidv4 } = require('uuid');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const axios = require('axios');
const Subject = require('../models/Subject');
const Resource = require('../models/Resource');
const { s3Client } = require('../middleware/uploadMiddleware');

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:8000';
const S3_BUCKET = process.env.S3_BUCKET_NAME || 'hive-study-resources';

// ═══════════════════════════════════════════════════════════════
//  SUBJECT CONTROLLERS
// ═══════════════════════════════════════════════════════════════

// POST /resources/subjects  (admin / superadmin)
const createSubject = async (req, res) => {
  try {
    const { subjectId, subjectName, subjectCode, level, semester, description } = req.body;

    if (!subjectId || !subjectName || !subjectCode || !level || !semester) {
      return res.status(400).json({ message: 'subjectId, subjectName, subjectCode, level and semester are required' });
    }

    const subject = new Subject({
      subjectId: subjectId.toUpperCase(),
      subjectName,
      subjectCode,
      level,
      semester,
      description: description || '',
      createdBy: req.user.uid,
    });

    await subject.save();
    return res.status(201).json({ message: 'Subject created', subject });
  } catch (err) {
    console.error('[createSubject]', err);
    if (err.code === 11000) return res.status(400).json({ message: 'Subject ID already exists' });
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /resources/subjects  (all authenticated)
const getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ isActive: true }).sort({ level: 1, semester: 1, subjectId: 1 });
    return res.json({ count: subjects.length, subjects });
  } catch (err) {
    console.error('[getAllSubjects]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /resources/subjects/:subjectId  (all authenticated)
const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findOne({ subjectId: req.params.subjectId.toUpperCase(), isActive: true });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    // Attach resources grouped by type
    const resources = await Resource.find({ subjectId: subject.subjectId, isActive: true }).select('-__v');
    const grouped = {
      past_papers:    resources.filter(r => r.resourceType === 'past_paper'),
      resource_books: resources.filter(r => r.resourceType === 'resource_book'),
      notes:          resources.filter(r => r.resourceType === 'note'),
    };

    return res.json({ subject, resources: grouped });
  } catch (err) {
    console.error('[getSubjectById]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PUT /resources/subjects/:subjectId  (admin / superadmin)
const updateSubject = async (req, res) => {
  try {
    const { subjectName, subjectCode, level, semester, description } = req.body;

    const subject = await Subject.findOne({ subjectId: req.params.subjectId.toUpperCase() });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    if (subjectName)  subject.subjectName  = subjectName;
    if (subjectCode)  subject.subjectCode  = subjectCode;
    if (level)        subject.level        = level;
    if (semester)     subject.semester     = semester;
    if (description !== undefined) subject.description = description;

    await subject.save();
    return res.json({ message: 'Subject updated', subject });
  } catch (err) {
    console.error('[updateSubject]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /resources/subjects/:subjectId  (superadmin — soft delete)
const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findOne({ subjectId: req.params.subjectId.toUpperCase() });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    subject.isActive = false;
    await subject.save();

    // Also soft-delete all resources belonging to this subject
    await Resource.updateMany({ subjectId: subject.subjectId }, { isActive: false });

    return res.json({ message: 'Subject and its resources soft-deleted', subjectId: subject.subjectId });
  } catch (err) {
    console.error('[deleteSubject]', err);
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

    const { subjectId, resourceType, title } = req.body;

    if (!subjectId || !resourceType || !title) {
      return res.status(400).json({ message: 'subjectId, resourceType and title are required' });
    }

    // Verify subject exists
    const subject = await Subject.findOne({ subjectId: subjectId.toUpperCase(), isActive: true });
    if (!subject) return res.status(404).json({ message: `Subject ${subjectId} not found` });

    // Build resource document
    const resource = new Resource({
      resourceId:   uuidv4(),
      subjectId:    subject.subjectId,
      subjectName:  subject.subjectName,
      resourceType,
      title,
      fileName:     req.file.originalname,
      fileSize:     req.file.size,
      mimeType:     req.file.mimetype,
      s3Key:        req.file.key,         // set by multer-s3
      s3Url:        req.file.location,    // set by multer-s3
      uploadedBy:   req.user.uid,
      isEmbedded:   false,
    });

    await resource.save();

    // ── Notify RAG service to start embedding pipeline ──────────────
    try {
      const ragPayload = {
        resourceId:   resource.resourceId,
        subjectId:    resource.subjectId,
        subjectName:  resource.subjectName,
        s3Url:        resource.s3Url,
        fileName:     resource.fileName,
        resourceType: resource.resourceType,
        uploadedBy:   resource.uploadedBy,
      };

      const ragRes = await axios.post(
        `${RAG_SERVICE_URL}/api/rag/ingest`,
        ragPayload,
        { timeout: 10000 }
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
    console.error('[uploadResource]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /resources/subject/:subjectId  (all authenticated)
const getResourcesBySubject = async (req, res) => {
  try {
    const subjectId = req.params.subjectId.toUpperCase();
    const subject   = await Subject.findOne({ subjectId, isActive: true });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    const resources = await Resource.find({ subjectId, isActive: true })
      .select('-__v -s3Key')
      .sort({ createdAt: -1 });

    // Group by resourceType
    const grouped = {
      past_papers:    resources.filter(r => r.resourceType === 'past_paper'),
      resource_books: resources.filter(r => r.resourceType === 'resource_book'),
      notes:          resources.filter(r => r.resourceType === 'note'),
    };

    return res.json({
      subject,
      totalResources: resources.length,
      resources: grouped,
    });
  } catch (err) {
    console.error('[getResourcesBySubject]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /resources/:resourceId  (all authenticated)
const getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findOne({ resourceId: req.params.resourceId, isActive: true }).select('-__v -s3Key');
    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    return res.json(resource);
  } catch (err) {
    console.error('[getResourceById]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /resources/:resourceId/download  (all authenticated)
const downloadResource = async (req, res) => {
  try {
    const resource = await Resource.findOne({ resourceId: req.params.resourceId, isActive: true });
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    // Generate pre-signed URL (expires in 1 hour)
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key:    resource.s3Key,
      ResponseContentDisposition: `attachment; filename="${resource.fileName}"`,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    // Increment download counter (non-blocking)
    Resource.findOneAndUpdate({ resourceId: resource.resourceId }, { $inc: { downloadCount: 1 } }).exec();

    return res.json({
      message:      'Download URL generated (valid for 1 hour)',
      fileName:     resource.fileName,
      fileSize:     resource.fileSize,
      presignedUrl,
      expiresIn:    3600,
    });
  } catch (err) {
    console.error('[downloadResource]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /resources/:resourceId  (admin / superadmin)
const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findOne({ resourceId: req.params.resourceId });
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    // Soft delete in MongoDB
    resource.isActive = false;
    await resource.save();

    // Notify RAG service to remove embeddings (non-fatal if it fails)
    try {
      await axios.delete(
        `${RAG_SERVICE_URL}/api/rag/documents/${resource.resourceId}`,
        { timeout: 5000 }
      );
      console.log(`[RAG] Embeddings deletion requested for ${resource.resourceId}`);
    } catch (ragErr) {
      console.warn(`[RAG] Could not delete embeddings: ${ragErr.message}`);
    }

    return res.json({
      message:    'Resource deleted successfully',
      resourceId: resource.resourceId,
    });
  } catch (err) {
    console.error('[deleteResource]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /resources/stats  (admin / superadmin)
const getResourceStats = async (req, res) => {
  try {
    const [
      totalResources,
      embeddedCount,
      byType,
      bySubject,
      topDownloaded,
    ] = await Promise.all([
      // Total active resources
      Resource.countDocuments({ isActive: true }),

      // Embedded count
      Resource.countDocuments({ isActive: true, isEmbedded: true }),

      // Count by resource type
      Resource.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$resourceType', count: { $sum: 1 }, totalDownloads: { $sum: '$downloadCount' } } },
        { $sort: { count: -1 } },
      ]),

      // Downloads per subject
      Resource.aggregate([
        { $match: { isActive: true } },
        { $group: {
          _id:            '$subjectId',
          subjectName:    { $first: '$subjectName' },
          resourceCount:  { $sum: 1 },
          totalDownloads: { $sum: '$downloadCount' },
        }},
        { $sort: { totalDownloads: -1 } },
      ]),

      // Top 5 most downloaded
      Resource.find({ isActive: true })
        .sort({ downloadCount: -1 })
        .limit(5)
        .select('resourceId title fileName subjectId subjectName resourceType downloadCount'),
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
    console.error('[getResourceStats]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  // Subjects
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  // Resources
  uploadResource,
  getResourcesBySubject,
  getResourceById,
  downloadResource,
  deleteResource,
  getResourceStats,
};
