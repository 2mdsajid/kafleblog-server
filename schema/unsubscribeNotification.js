const mongoose = require('mongoose');

const unsubscribeNotification = new mongoose.Schema({
    email: {
        type: [String],
        default:[]
    }
});

const UnsubNotific = mongoose.model('unsubnotific', unsubscribeNotification);

module.exports = UnsubNotific;
