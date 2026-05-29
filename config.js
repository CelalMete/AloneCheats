require('dotenv').config();

module.exports = {
   ltcAddress: process.env.LTC_WALLET_ADDRESS,
   usdtAddress: process.env.USDT_WALLET_ADDRESS,
   btcAddress: process.env.BTC_WALLET_ADDRESS,
   moneroAddress: process.env.MNR_WALLET_ADDRESS
};