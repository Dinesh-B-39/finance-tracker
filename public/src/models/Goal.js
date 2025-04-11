const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
    name: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    currentAmount: { type: Number, default: 0 },
    deadline: { type: Date, required: true }
});

module.exports = mongoose.model('Goal', goalSchema);