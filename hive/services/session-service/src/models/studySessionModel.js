const mongoose = require("mongoose");

const studySessionSchema = new mongoose.Schema({
  subjectCode: { type: String, required: true },
  batch: { type: Number, index: true },
  type: { type: String, required: true },
  topic: { type: String, required: true },
  description: { type: String, required: false, default: "" },

  date: {
    type: Date,
    required: true
  },

  time: {
    type: String,
    required: true
  },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("StudySession", studySessionSchema);