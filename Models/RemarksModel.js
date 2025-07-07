const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const remarksSchema = new mongoose.Schema({
  closure: String,
  leadGen: String,
  remark: String,
  date: {
    type: Date,
    default: Date.now
  }
});

remarksSchema.plugin(AutoIncrement, { inc_field: 'remarkId' });

module.exports = mongoose.model('Remark', remarksSchema);