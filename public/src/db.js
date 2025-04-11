const mongoose = require('mongoose');

const connect = () => {
    return mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/finance-tracker', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
};

module.exports = { connect };