const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema(
  {
    moduleCode: { type: String, required: true, trim: true },
    moduleName: { type: String, required: true, trim: true },
    creditHours: { type: Number, required: true, min: 1, max: 9 },
    grade: {
      type: String,
      required: true,
      enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'E'],
    },
    gradePoints: { type: Number, required: true, min: 0, max: 4 },
  },
  { _id: false }
);

const semesterSchema = new mongoose.Schema(
  {
    year: { type: String, required: true, trim: true },
    semester: { type: Number, required: true, enum: [1, 2] },
    modules: { type: [moduleSchema], required: true, default: [] },
    semesterGPA: { type: Number, required: true, min: 0, max: 4 },
    totalCredits: { type: Number, required: true, min: 0 },
  },
  { timestamps: false }
);

const progressSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    studentNumber: { type: String, required: true, trim: true, index: true },
    semesters: { type: [semesterSchema], default: [] },
    cumulativeGPA: { type: Number, default: 0, min: 0, max: 4 },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Progress', progressSchema);
