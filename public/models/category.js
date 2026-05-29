const mongoose = require("mongoose");
const gameSchema = new mongoose.Schema({
    GameName: { type: String, required: true }, 
    GameIcon: { type: String } 
});

module.exports =  mongoose.model("game", gameSchema);
