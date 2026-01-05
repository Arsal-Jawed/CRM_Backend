const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  notifier: { type: String, required: true },
  detail: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now }
}, {
  timestamps: true
});

// Index for efficient date-based queries
notificationSchema.index({ date: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

