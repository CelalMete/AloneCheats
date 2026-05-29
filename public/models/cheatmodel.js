const mongoose = require("mongoose");
const InfoBlockSchema = new mongoose.Schema({
    blockTitle: { type: String },  
    subTitle: { type: String },                    
    items: { type: [String], default: [] }          
});
const PriceSchema = new mongoose.Schema({
    PriceTitle: { type: String},  
    Stock: { type: Number},                    
    Price: { type: Number}          
});
const cheatSchema = new mongoose.Schema({
    CheatName: { type: String  },
    Photo : String,
    Photos:[String],
    Price: [PriceSchema],
    infoBlocks: [InfoBlockSchema],
    categoryId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'game',
    }
});

module.exports = mongoose.model("cheat", cheatSchema);