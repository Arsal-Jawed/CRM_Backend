const mongoose = require('mongoose');

const users = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: Number, required: true },
    designation: { type: String },
    contact: { type: String },
    team: { type: Number, default: 0 },
    joining_date: { type: String, default: () => new Date().toLocaleDateString() },
    verified: { type: Boolean, default: false },
    cnic: { type: String },
    accountNo: { type: String },
    achademics: { type: String },
    profilePic: { type: String }
});

module.exports = mongoose.model('User', users);