const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    nick: { type: String  },
    rutbe: {type: String,default:"user"},
    email: { type: String, required: true, match:[/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Geçersiz e-posta adresi'] },
    password: { type: String, required: true },
    kayitTarihi: { type: Date, default: Date.now }
});

module.exports = mongoose.model("user", userSchema);