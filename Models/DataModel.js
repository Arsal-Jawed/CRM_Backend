const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true
  },
  business_name: {
    type: String,
    required: true
  },
  business_contact: {
    type: String,
    required: true
  },
  owner_name: {
    type: String,
    required: true
  },
  details: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  followupDate: {
    type: Date
  }
});

module.exports = mongoose.model('Data', dataSchema);