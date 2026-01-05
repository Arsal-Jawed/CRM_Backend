const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user_email: { type: String, required: true },
  date: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['Present', 'Absent', 'Leave', 'Late', 'Half'], 
    default: 'Present' 
  },
  check_in_time: { type: String },
  check_out_time: { type: String },
  remarks: { type: String, default: '' }
}, {
  timestamps: true
});

// Compound index for efficient queries
attendanceSchema.index({ user_email: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);

