const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const equipmentSchema = new mongoose.Schema({
  EqmId: { type: Number, unique: true },
  clientId: { type: Number, required: true },
  brand: { type: String, required: true },
  equipement: { type: String, required: true },
  quantity: { type: Number, required: true },
  leaseAmount: { type: mongoose.Types.Decimal128, required: true },
  Accessory: { type: String }
});

equipmentSchema.plugin(AutoIncrement, { inc_field: 'EqmId' });

module.exports = mongoose.model('Equipment', equipmentSchema);