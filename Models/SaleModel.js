const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({

  clientId: { type: String, required: true },
  rm: { type: String, Default: 'Yazan Adnan'},

  currentStatus: { type: String, Default:'New'},

  submitDate: { type: Date },
  submitBy: { type: String },

  approvalStatus: { type: String, enum: ['Activated', 'Approved', 'Submitted' ,'Rejected', 'Pending', 'Underwriting', 'Buyback'], default: 'Pending' },
  approveDate: { type: Date },
  approveBy: { type: String },

  deliveredDate: { type: Date },
  deliveredBy: { type: String },

  activationDate: { type: Date },
  activatedBy: { type: String },

  leaseSubmitDate: { type: Date },
  leaseSubmitBy: { type: String },

  leaseApprovalStatus: { type: String, enum: ['Approved', 'Rejected', 'Pending','Buyback', 'Funded'], default: 'Pending' },
  leaseApprovalDate: { type: Date },
  leaseApprovedBy: { type: String },
  leasingCompany: {type: String, Default:'PCL'},

  creditScore: { type: String, Default: 'C' }
});

module.exports = mongoose.model('Sale', saleSchema);