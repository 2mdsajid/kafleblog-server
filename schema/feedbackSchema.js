const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  name: {
    type: String,
    default:''
  },
  email: {
    type: String,
    required:''
  },
  feedback: {
    type: String,
    require:true
  },
  feedbackAt: {
    type: Date,
    default: Date.now
  }
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
