const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    subjectCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    subjectName: { type: String, required: true, trim: true },
    level: { type: Number, required: true, enum: [1, 2, 3, 4], index: true },
    semester: { type: Number, required: true, enum: [1, 2], index: true },
    creditHours: { type: Number },
    status: {
      type: String,
      enum: ['compulsory', 'optional', 'specialisation'],
      default: 'compulsory',
      index: true,
    },
    specialisationTrack: {
      type: String,
      default: null,
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

const extractCreditHours = (subjectCode = '') => {
  const compactCode = String(subjectCode).replace(/\s+/g, '').toUpperCase();
  const lastChar = compactCode.slice(-1);
  const parsed = Number.parseInt(lastChar, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

courseSchema.pre('validate', function setComputedFields(next) {
  if (this.subjectCode) {
    this.subjectCode = this.subjectCode.trim().toUpperCase();
  }

  const extractedCredits = extractCreditHours(this.subjectCode);
  if (!extractedCredits) {
    return next(new Error('Invalid subjectCode. Unable to extract credit hours from last digit.'));
  }

  this.creditHours = extractedCredits;

  if (this.status !== 'specialisation') {
    this.specialisationTrack = null;
  }

  if (this.status === 'specialisation' && !this.specialisationTrack) {
    return next(new Error('specialisationTrack is required when status is specialisation'));
  }

  return next();
});

courseSchema.statics.extractCreditHours = extractCreditHours;

module.exports = mongoose.model('Course', courseSchema);
