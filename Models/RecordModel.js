const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
  lead_id: {
    type: Number,
    required: true
  },
  file_path: {
    type: String,
    required: true,
    maxlength: 500
  },
}, { timestamps: true });

module.exports = mongoose.model('Record', recordSchema);