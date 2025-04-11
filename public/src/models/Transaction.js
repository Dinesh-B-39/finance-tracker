const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    date: { type: Date, required: true },
    type: { type: String, required: true }
});

module.exports = mongoose.model('Transaction', transactionSchema);