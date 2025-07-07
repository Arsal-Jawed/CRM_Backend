const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const leadSchema = new mongoose.Schema({
  lead_id: { type: Number },
  email: { type: String, required: true },
  person_name: { type: String, required: true },
  personal_email: { type: String, required: true },
  business_name: { type: String, required: true },
  business_email: { type: String},
  contact: { type: String, required: true },
  business_contact: { type: String},
  address: { type: String},
  followupDate: {type: Date, required: true},

  status: { type: String, default: 'in process' },
  rating: { type: Number, default: 0 },
  ratedBy: { type: String },
  ratingDate: { type: Date },

  date: { type: String, default: () => new Date().toLocaleDateString() },
  time: { type: String, default: () => new Date().toLocaleTimeString() },

  closure1: { type: String, required: true, default: 'not specified' },
  closure2: { type: String, default: 'not specified' },

  assignDate1: {type: Date},
  assignDate2: {type: Date},

  type: { type: Number, enum: [1, 2], default: 1 },
  saleType: { type: String, enum: ['lease', 'rent', 'purchase'], default: 'purchase' },
  saleCloseDateTime: { type: Date },
  notes: { type: String },

  businessRole: { type: String },
  yearsInBusiness: { type: Number },
  incorporateState: { type: String },
  locations: { type: Number },

  dob: { type: Date },
  ssn: { type: String },
  driversLicenseNumber: { type: String },
  ownershipPercentage: { type: Number },

  bankName: { type: String },
  rtn: { type: String },
  accountNumber: { type: String },
  accountType: { type: String }
});

leadSchema.plugin(AutoIncrement, { inc_field: 'lead_id' });

module.exports = mongoose.model('Lead', leadSchema);
