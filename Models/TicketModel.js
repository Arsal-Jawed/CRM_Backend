const mongoose = require('mongoose');

let autoIncrement = 1;

const TicketSchema = new mongoose.Schema({
  ticketId: {
    type: Number,
    unique: true
  },
  leadId: {
    type: Number,
    ref: 'Lead',
    required: true
  },
  generatorType: {
    type: String,
    enum: ['Sale Agent', 'Operation Agent'],
    required: true
  },
  generator: {
    type: String,
    ref: 'User',
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
  status: {
    type: String,
    enum: ['Pending', 'Resolved'],
    default: 'Pending'
  },
  resolver: {
    type: String,
    ref: 'User'
  },
  resolveDate: Date
});

TicketSchema.pre('save', async function (next) {
  if (this.isNew) {
    const lastTicket = await this.constructor.findOne().sort('-ticketId');
    this.ticketId = lastTicket ? lastTicket.ticketId + 1 : autoIncrement;
  }
  next();
});

module.exports = mongoose.model('Ticket', TicketSchema);