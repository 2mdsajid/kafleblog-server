const mongoose = require('mongoose');

const dailyUserSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        unique: true
    },
    count: {
        type: Number,
        default: 0
    }
});

const DailyVisit = mongoose.model('dailyvisit', dailyUserSchema);

module.exports = DailyVisit;
