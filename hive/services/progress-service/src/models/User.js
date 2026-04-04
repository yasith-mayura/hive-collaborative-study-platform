const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    studentNumber: { type: String },
    batch: { type: Number },
    email: { type: String },
    role: { type: String, enum: ['student', 'admin', 'superadmin'], default: 'student' },
    firebaseUid: { type: String, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
