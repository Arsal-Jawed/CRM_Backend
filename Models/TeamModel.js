const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const teams = new mongoose.Schema({
  teamId: { type: Number },
  teamName: { type: String, required: true },
  TeamLeader: { type: String, required: true },
  teamGoal: { type: String, default: 'not specified' },
  teamRating: { type: Number, default: 1 }
});

teams.plugin(AutoIncrement, { inc_field: 'teamId' });

module.exports = mongoose.model('Team', teams);