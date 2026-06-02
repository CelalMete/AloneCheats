const mongoose = require('mongoose');
const OrderItemSchema = new mongoose.Schema({
    cheatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cheat', required: true },
    cheatName: { type: String, required: true },
    packageTitle: { type: String, required: true },
    qty: { type: Number, required: true, default: 1 },
    pricePaid: { type: Number, required: true }
}, { _id: false }); // Alt elemanlar için gereksiz ID oluşturulmasını engeller

const OrderSchema = new mongoose.Schema({
    email: { type: String, required: true },
    items: [OrderItemSchema], 
    totalPriceUSD: { type: Number, required: true },
    txid: { type: String, required: true, unique: true },
    method: { type: String, enum: ['ltc', 'usdt', 'btc', 'xmr'], required: true },
    status: { type: String, enum: ['pending', 'completed', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);