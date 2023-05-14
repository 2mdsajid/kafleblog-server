const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  uniqueid: {
    type: String,
    required: true
  },
  ipaddress: {
    type: String,
    required: true
  },
  useragent: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true
  }
});

const Visitor = mongoose.model('Visitor', visitorSchema);

module.exports = Visitor;
