const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
    clientId: {type: String, required: true},
    date: {type: Date, required: true},
    caller: {type: String, required: true},
    remarks: {type: String, required: true}
});

module.exports = mongoose.model('Call',callSchema);