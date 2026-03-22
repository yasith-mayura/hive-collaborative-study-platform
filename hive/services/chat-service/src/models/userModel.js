const mongoose = require('mongoose');

// Minimal user projection used by chat-service to resolve batch/identity.
const chatUserSchema = new mongoose.Schema(
  {
    name: { type: String },
    studentNumber: { type: String },
    batch: { type: Number },
    role: { type: String },
    firebaseUid: { type: String, index: true },
    isActive: { type: Boolean, default: true },
  },
  {
    collection: 'users',
    strict: false,
  }
);

module.exports = mongoose.model('ChatUser', chatUserSchema);
