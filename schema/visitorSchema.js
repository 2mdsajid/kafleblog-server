const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  uniqueid: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
  }
});

const Visitor = mongoose.model('Visitor', visitorSchema);

module.exports = Visitor;
