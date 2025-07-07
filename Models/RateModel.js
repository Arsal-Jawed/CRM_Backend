const mongoose = require('mongoose');

const rateSchema = new mongoose.Schema({
  clientId: { type: String, required: true },
  rating: { type: Number, required: true },
  closure: { type: String, required: true },
  ratingdate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Rate', rateSchema);