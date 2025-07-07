const mongoose = require('mongoose');

const docSchema = new mongoose.Schema({
    clientId: {type: String, required: true},
    docName: {type: String, required: true},
    path: {type: String, required: true},
    type: {type: String, required: true},
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Doc',docSchema);