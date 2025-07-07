const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const clientSchema = new mongoose.Schema({
  id: { type: Number },
  name: { type: String, required: true },
  email: { type: String, required: true },
  contact: { type: String, required: true },
  business: { type: String, required: true },
  business_email: { type: String, default: 'none' },
  business_contact: { type: String, default: 'none' },
  address: { type: String, required: true },
  leadGen: { type: String, required: true },
  closure1: { type: String, required: true, default: 'not specified' },
  closure2: { type: String, default: 'not specified' },
  date: { type: Date, default: Date.now }
});

clientSchema.plugin(AutoIncrement, { inc_field: 'id' });

module.exports = mongoose.model('Client', clientSchema);