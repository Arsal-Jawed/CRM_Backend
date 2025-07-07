const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const msgSchema = new mongoose.Schema({
  sender: String,
  reciever: String,
  subject: String,
  message: String,
  date: {
    type: Date,
    default: Date.now
  },
  seen: {
    type: Boolean,
    default: false
  },
  edited: {
    type: Boolean,
    default: false
  }
});

msgSchema.plugin(AutoIncrement, { inc_field: 'messageId' });

module.exports = mongoose.model('Message', msgSchema);