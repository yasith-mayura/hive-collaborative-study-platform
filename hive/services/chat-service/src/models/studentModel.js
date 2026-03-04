const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: String,
  studentId: String,
  batch: String,
  email: String
});

module.exports = mongoose.model('Student', studentSchema);