const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
require('dotenv').config();//no need for multer for now 
const path = require('path');//same
const fs = require('fs');//probably same
const app = express();
const config = require('./config')

app.use(express.static(path.join(__dirname, 'public')));//important
app.use(express.json());
app.set('view engine', 'ejs');
app.set('public', path.join(__dirname, 'public'));//important2
app.use(express.urlencoded({ extended: true }));
const { KategoriUpload,CheatUpload} = require('./cloudinary')
const category = require('./public/models/category')
const cheat = require('./public/models/cheatmodel');
const user = require('./public/models/usermodel');
const Order = require('./public/models/ordermodel');
const dbURL = process.env.MONGO_URI;
 const axios = require('axios');
console.log("-------------------------------------------------");
console.log("🌍 SRV BAĞLANTISI DENENİYOR...");
mongoose.connect(dbURL)
  .then(() => console.log("Bağlantı Başarılı"))
  .catch(err => console.error(err));
//no need for database i think and i hope ( nope....)
//code start point
const validateTxid = (req, res, next) => {
    const { txid } = req.body;
    const txidRegex = /^[a-fA-F0-9]{64}$/; 
    if (!txidRegex.test(txid)) {
        return res.status(400).send("Geçersiz TXID formatı. Lütfen kontrol edip tekrar girin.");
    }
    next();
};
async function verifyPayment(txid, method, expectedAmount) {
    try {
        const myAddress = config[`${method}Address`];
        let receivedAmount = 0;

        // --- 1. YOL: USDT (TRC20 - TRON AĞI) KONTROLÜ ---
        if (method === 'usdt') {
            const response = await axios.get(`https://apilist.tronscanapi.com/api/transaction-info?hash=${txid}`);
            const tx = response.data;

            // İşlem Tron ağında yoksa
            if (Object.keys(tx).length === 0 || !tx.hash) {
                 return { success: false, message: "Böyle bir işlem (TXID) bulunamadı." };
            }

            // Onay ve Başarı kontrolü (Tron ağı 'SUCCESS' döner)
            if (tx.contractRet !== "SUCCESS" || !tx.confirmed) {
                return { success: false, message: "İşlem henüz onay almadı veya başarısız. Lütfen bekleyip tekrar deneyin." };
            }

            // İşlem içindeki token transferlerini bul
            if (!tx.trc20TransferInfo) {
                 return { success: false, message: "Bu işlemde USDT transferi bulunamadı." };
            }
            const transfer = tx.trc20TransferInfo.find(t => t.to_address === myAddress && t.symbol === 'USDT');
            if (!transfer) {
                return { success: false, message: "Ödeme alıcısı eşleşmedi veya gönderilen coin USDT değil." };
            }
            receivedAmount = Number(transfer.amount_str) / 1000000;

        } 
        else {
            const networkMap = { ltc: 'litecoin', btc: 'bitcoin', xmr: 'monero' };
            const network = networkMap[method];
            if (!network) throw new Error("Desteklenmeyen yöntem!");

            const response = await axios.get(`https://api.blockchair.com/${network}/dashboards/transaction/${txid}`);
            const tx = response.data.data[txid];

            if (tx.transaction.block_id === -1 || tx.transaction.block_id === null) {
                return { success: false, message: "İşlem henüz onay almadı. Lütfen bekleyip tekrar deneyin." };
            }

            const recipientData = tx.outputs.find(out => out.recipient === myAddress);
            if (!recipientData) {
                return { success: false, message: "Ödeme alıcısı eşleşmedi." };
            }

            const decimalsMap = { ltc: 100000000, btc: 100000000, xmr: 1000000000000 };
            receivedAmount = Number(recipientData.value) / decimalsMap[method];
        }
        const expected = Number(expectedAmount);
        console.log(`DEBUG -> Yöntem: ${method.toUpperCase()}, Beklenen: ${expected.toFixed(5)}, Gelen: ${receivedAmount.toFixed(5)}`);

        if (isNaN(expected) || isNaN(receivedAmount) || expected <= 0) {
            return { success: false, message: "Sistem hatası: Tutar sayısal bir değer değil!" };
        }

        const minAcceptable = expected * 0.98;
        const maxAcceptable = expected * 1.05;

        if (receivedAmount < minAcceptable || receivedAmount > maxAcceptable) {
            return { 
                success: false, 
                message: `Tutar hatalı! Gereken: ${expected.toFixed(4)}, Gönderilen: ${receivedAmount.toFixed(4)}` 
            };
        }

        return { success: true };

    } catch (e) {
        // Axios API sorgusu 404 patlarsa (Blockchair için)
        if (e.response && e.response.status === 404) {
             return { success: false, message: "Böyle bir işlem (TXID) bulunamadı." };
        }
        console.error("Doğrulama hatası:", e.message);
        return { success: false, message: "Doğrulama sırasında ağ hatası oluştu." };
    }
}

app.get('/',async(req,res)=>{
  const games =await category.find()
   res.render('main',{
      games,
      content:'home',
      style:'store.css'
   })
})
app.get('/uploadcheat2', async (req, res) => {
    const games = await category.find(); // Kategori listesini çek
    res.render('main', {
        games, // Formdaki select için gerekli
        content: 'upladncheat',
        style: 'store.css'
    });
});
app.get('/uploadcheat',async(req,res)=>{
   res.render('main',{
      content:'upload',
      style:'store.css'
   })
})
app.get('/category/:id',async(req,res)=>{
   let id=req.params.id;
   const cheats= await cheat.find( {categoryId:id})
   res.render('main',{
      cheats,
      content:'game',
      style:'store.css'
   })
})
app.get('/cheats/:id',async(req,res)=>{
   const cheatinfo= await cheat.findById(req.params.id)
   res.render('main',{
      cheat:cheatinfo,
      content:'cheat',
      style:'store.css'
   })
})
app.get('/checkout', async (req, res) => {

    const product = await cheat.findById(req.query.cheatId);
    const wallets = {
        ltc: process.env.LTC_WALLET_ADDRESS,
        usdt:process.env.USDT_WALLET_ADDRESS,
        btc:  process.env.BTC_WALLET_ADDRESS,
        xmr: process.env.XMR_WALLET_ADDRESS
    };
    
    const selectedPackage = product.Price.find(p => p.PriceTitle === req.query.title);
    const price = selectedPackage ? selectedPackage.Price : 0;
    if (!product) return res.status(404).send("Hile bulunamadı!");
    res.render('main', {
        content: 'order', 
        style: 'payment.css',
        title: req.query.title,price: price,
        cheatName: req.query.cheatName,
        qty: req.query.qty,wallets: wallets ,
        cheatId:product._id
    });
});
app.post('/submit-payment', validateTxid, async (req, res) => {
    try {
        const { cheatId, packageTitle, txid, method, email } = req.body; 
        
        const product = await cheat.findById(cheatId);
        if (!product) return res.status(400).send("Geçersiz ürün!");
        
        const selectedPackage = product.Price.find(p => p.PriceTitle === packageTitle);
        if (!selectedPackage) return res.status(400).send("Geçersiz paket seçimi!");

        const dbPriceUSD = selectedPackage.Price;
        
        const coinGeckoMap = { ltc: 'litecoin', btc: 'bitcoin', xmr: 'monero', usdt: 'tether' };
        const cryptoId = coinGeckoMap[method];
        if (!cryptoId) return res.status(400).send("Desteklenmeyen ödeme yöntemi.");

        const { data } = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=usd`);
        const currentCryptoPrice = data[cryptoId].usd; 
        
        const expectedCryptoAmount = dbPriceUSD / currentCryptoPrice;
        
        const result = await verifyPayment(txid, method, expectedCryptoAmount);
        
        if (!result.success) {
            return res.status(400).send(`Ödeme doğrulanamadı: ${result.message}`);
        }
        
        const existingOrder = await Order.findOne({ txid });
        if (existingOrder) return res.status(400).send("Bu TXID zaten kullanılmış!");
        
        await Order.create({
            email, 
            cheatId, 
            txid,
            method,
            status: 'completed'
        });
        
        res.send(`Ödemen alındı! Hile bilgileri ${email} adresine gönderilecek.`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Bir hata oluştu.");
    }
});
app.post('/add-cheat2', CheatUpload, async (req, res) => {
    try {
        // 1. Ana resim var mı?
        const coverUrl = req.files['coverImage'] ? req.files['coverImage'][0].path : null;
        const galleryUrls = req.files['otherImages'] 
            ? req.files['otherImages'].map(f => f.path) 
            : [];

        const newCheat = new cheat({
            CheatName:req.body.name,
            Photo: coverUrl,      
            Photos: galleryUrls,  
          categoryId: req.body.categoryId
        });

        await newCheat.save();
        res.redirect('/');
    } catch (err) {
        res.status(500).send("Hata: " + err.message);
    }
});
app.post('/add-cheat', KategoriUpload, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send("Resim yüklenmedi!");
        }
        const coverUrl = req.file.path; 
        const yenicategory = new category({
            GameName: req.body.name,
            GameIcon: coverUrl,      
        });
        await yenicategory.save();
        res.redirect('/'); 
      } catch (err) {
        res.status(500).send("Yükleme hatası: " + err.message);
    }
});
app.post('/cheats/add-price/:id', async (req, res) => {
    const { PriceTitle, Stock, Price } = req.body;
    await cheat.findByIdAndUpdate(req.params.id, {
        $push: { Price: { PriceTitle, Stock, Price } }
    });
    res.redirect(`/cheats/${req.params.id}`);
});

// 2. Info Bloğu Ekleme
app.post('/cheats/add-info/:id', async (req, res) => {
    const { blockTitle,subTitle, items, } = req.body;
    const itemsArray = items.split(',').map(item => item.trim());
    
    await cheat.findByIdAndUpdate(req.params.id, {
        $push: { infoBlocks: { blockTitle,subTitle, items: itemsArray } }
    });
    res.redirect(`/cheats/${req.params.id}`);
});
app.get('/search', async (req, res) => {
    const query = req.query.q; 
    const results = await cheat.find({ 
        CheatName: { $regex: query, $options: 'i' } 
    });
    
    res.json(results);
});
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Nodemon aktif: http://localhost:${PORT}/ adresine git.`);
});
