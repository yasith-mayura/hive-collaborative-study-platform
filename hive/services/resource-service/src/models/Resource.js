const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const resourceSchema = new mongoose.Schema(
  {
    resourceId: {
      type: String,
      unique: true,
      default: () => uuidv4(),
    },
    subjectCode: {
      type: String,
      required: true,
      ref: 'Subject',
    },
    subjectName: {
      type: String,
      required: true,
    },
    resourceType: {
      type: String,
      enum: ['past_paper', 'resource_book', 'note'],
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,   // bytes
      default: 0,
    },
    mimeType: {
      type: String,
      default: 'application/pdf',
    },
    s3Key: {
      type: String,
      required: true,
    },
    s3Url: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // RAG embedding status
    isEmbedded: {
      type: Boolean,
      default: false,
    },
    embeddedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for common queries
resourceSchema.index({ subjectCode: 1, resourceType: 1 });
resourceSchema.index({ resourceId: 1 });

module.exports = mongoose.model('Resource', resourceSchema);
