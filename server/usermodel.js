const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    expenses: [{
        account: String,
        amount: Number,
        category: String,
        type: String,
        date: Date,
        note: String
    }],
    qrCode: {
        type: String,
        default: null
    }
});

module.exports = mongoose.model('User', UserSchema);