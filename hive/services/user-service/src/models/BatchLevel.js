const mongoose = require('mongoose');

const batchLevelSchema = new mongoose.Schema(
  {
    batch: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    level: {
      type: Number,
      enum: [1, 2, 3, 4],
      required: true,
      unique: true,
    },
    assignedBy: {
      type: String,
      required: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.BatchLevel || mongoose.model('BatchLevel', batchLevelSchema);
