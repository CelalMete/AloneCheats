const mongoose = require('mongoose');
const keySchema = new mongoose.Schema({
    cheatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'cheat',
        required: true
    },
    priceId: {
        type: mongoose.Schema.Types.ObjectId, 
        required: true
    },
    keyCode: {
        type: String,
        required: true,
        unique: true 
    },
    isUsed: {
        type: Boolean,
        default: false 
    },
    soldTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    soldAt: {type: Date}
}, 
{ timestamps: true });

module.exports = mongoose.model('Key', keySchema);