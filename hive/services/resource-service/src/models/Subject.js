const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    subjectId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,  // always stored as "SE3010"
    },
    subjectName: {
      type: String,
      required: true,
      trim: true,
    },
    subjectCode: {
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
    description: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subject', subjectSchema);
