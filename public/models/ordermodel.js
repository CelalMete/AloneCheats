const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
   email: { type: String, required: true },
    cheatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cheat', required: true},
    txid: { type: String, required: true, unique: true }, // Aynı ödeme iki kez kullanılmasın diye unique
    method: { type: String, enum: ['ltc', 'usdt'], required: true },
    status: { type: String, enum: ['pending', 'completed', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);