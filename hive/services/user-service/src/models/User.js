const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    studentNumber: { type: String, unique: true, sparse: true },
    batch: { type: Number },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String },
    role: { type: String, enum: ['student', 'admin', 'superadmin'], default: 'student' },
    firebaseUid: { type: String, unique: true, sparse: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Pre-save hook to extract batch from studentNumber
userSchema.pre('save', function(next) {
  if (this.studentNumber && this.isModified('studentNumber')) {
    // Extract year from format: SE/2020/007
    const match = this.studentNumber.match(/^SE\/(\d{4})\/\d{3}$/);
    if (match) {
      this.batch = parseInt(match[1], 10);
    }
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
