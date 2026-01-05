const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  scheduler: { type: String, required: true },
  details: { type: String, required: true },
  set_date: { type: Date, default: Date.now },
  visibility: { 
    type: String, 
    enum: ['public', 'private'], 
    default: 'private' 
  },
  schedule_date: { type: Date, required: true },
  seen: { 
    type: String, 
    enum: ['pending', 'marked', 'missed'], 
    default: 'pending' 
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
scheduleSchema.index({ scheduler: 1 });
scheduleSchema.index({ schedule_date: 1 });
scheduleSchema.index({ visibility: 1, scheduler: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema);

