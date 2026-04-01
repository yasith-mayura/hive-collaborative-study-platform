const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    courseCode: { type: String, required: true, unique: true, trim: true },
    courseName: { type: String, required: true, trim: true },
    creditHours: { type: Number, required: true, min: 1 },
    year: { type: Number, required: true, enum: [1, 2, 3, 4], index: true },
    semester: { type: Number, required: true, enum: [1, 2], index: true },
    status: {
      type: String,
      required: true,
      enum: ['compulsory', 'optional', 'specialisation'],
      index: true,
    },
    specialisationTrack: {
      type: String,
      enum: ['Net', 'Mobile', 'Data', 'Health', 'Gaming', 'Business'],
      default: undefined,
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

const extractCreditHours = (courseCode = '') => {
  const compactCode = String(courseCode).replace(/\s+/g, '').toUpperCase();
  const lastChar = compactCode.slice(-1);
  const parsed = Number.parseInt(lastChar, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

courseSchema.pre('validate', function setComputedFields(next) {
  if (this.courseCode) {
    this.courseCode = this.courseCode.trim().toUpperCase();
  }

  const extractedCredits = extractCreditHours(this.courseCode);
  if (!extractedCredits) {
    return next(new Error('Invalid courseCode. Unable to extract credit hours from last digit.'));
  }

  this.creditHours = extractedCredits;

  if (this.status !== 'specialisation') {
    this.specialisationTrack = undefined;
  }

  if (this.status === 'specialisation' && !this.specialisationTrack) {
    return next(new Error('specialisationTrack is required when status is specialisation'));
  }

  return next();
});

courseSchema.statics.extractCreditHours = extractCreditHours;

module.exports = mongoose.model('Course', courseSchema);
