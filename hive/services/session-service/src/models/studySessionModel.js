const mongoose = require("mongoose");

const studySessionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,

  },
  topic: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
    validate: {
      validator: (v) => v instanceof Date && !isNaN(v),
      message: props => `${props.value} is not a valid date!`
    }
  },
  time: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model("StudySession", studySessionSchema);