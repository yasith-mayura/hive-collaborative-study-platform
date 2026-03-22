const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    batch: { type: String, required: true, index: true },
    senderId: { type: String, required: true, index: true },
    senderName: { type: String, required: true },
    senderStudentNumber: { type: String, required: true },
    content: { type: String, required: true, trim: true },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false }
);

messageSchema.index({ batch: 1, timestamp: 1 });

module.exports = mongoose.model('Message', messageSchema);
