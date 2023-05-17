const mongoose = require('mongoose');

const newvisitorSchema = new mongoose.Schema({
  uniqueid: {
    type: String,
    required: true
  },
  useragent: {
    type: String,
    default:''
  },
  ip: {
    type: String,
    default:''
  },
  timestamp: {
    type: Date,
    default: Date.now,
  }
});

const newVisitor = mongoose.model('NewVisitor', newvisitorSchema);

module.exports = newVisitor;
