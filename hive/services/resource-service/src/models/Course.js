const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    subjectCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    subjectName: {
      type: String,
      required: true,
      trim: true,
    },
    level: {
      type: Number,
      enum: [1, 2, 3, 4],
      required: true,
    },
    semester: {
      type: Number,
      enum: [1, 2],
      required: true,
    },
    creditHours: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['compulsory', 'optional', 'specialisation'],
      default: 'compulsory',
    },
    specialisationTrack: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, collection: 'courses' }
);

module.exports = mongoose.models.Course || mongoose.model('Course', courseSchema);
