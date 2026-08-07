const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const session = require('express-session');
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const app = express();
const config = require('./config')
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 gün
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('public', path.join(__dirname, 'public'));
app.use(express.urlencoded({ extended: true }));
const { KategoriUpload,CheatUpload} = require('./cloudinary')
const category = require('./public/models/category')
const Kullanici = require('./public/models/usermodel')
const cheat = require('./public/models/cheatmodel');
const Key = require('./public/models/keymodel');
const Order = require('./public/models/ordermodel');
const dbURL = process.env.MONGO_URI;
 const axios = require('axios');
 const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND);
async function sendEmail(toEmail, verificationCode) {
  try{
    const veri = await resend.emails.send({
      from: 'admin@frontiera.store', 
      to: toEmail,
  subject: `${verificationCode}`,
  html: '<p>Congrats on sending your <strong>first email</strong>!</p>'
    });
    console.log("RESEND CEVABI:", veri);
  } catch (err) {
    console.error("E-posta hatası:", err); 
    throw err;
}}
console.log("-------------------------------------------------");
console.log("🌍 SRV BAĞLANTISI DENENİYOR...");
mongoose.connect(dbURL)
  .then(() => console.log("Bağlantı Başarılı"))
  .catch(err => console.error(err));

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

            if (Object.keys(tx).length === 0 || !tx.hash) {
                 return { success: false, message: "Böyle bir işlem (TXID) bulunamadı." };
            }

            if (tx.contractRet !== "SUCCESS" || !tx.confirmed) {
                return { success: false, message: "İşlem henüz onay almadı veya başarısız. Lütfen bekleyip tekrar deneyin." };
            }

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

const authMiddleware = (req, res, next) => {
  if (!req.session || !req.session.user) {
      return res.redirect('/login');
  }
  next();
};

function isAdmin1(req, res, next) {
  if (!req.session.user || !req.session.user.rutbe) {
    return res.status(401).json({ message: "Giriş yapmanız gerekiyor." });
  }

  if (req.session.user.rutbe !== "admin") {
    return res.status(403).json({ message: `Bu sayfaya erişim yetkiniz yok.` });
  }

  next(); 
}

function isAdmin2(req, res, next) {
  if (!req.session.user || !req.session.user.rutbe) {
    return res.status(401).json({ message: "Giriş yapmanız gerekiyor." });
  }
  
  // Düzeltilen Kısım: Admin veya Seller rütbelerinden biri varsa izin ver
  const allowedRoles = ["admin", "seller"];
  if (!allowedRoles.includes(req.session.user.rutbe)) {
    return res.status(403).json({ message: "Bu sayfaya erişim yetkiniz yok." });
  }
  
  next(); 
}
app.get('/login', (req, res) => {
    res.render('main', {
        content: 'login',
        style: 'payment.css'
    });
});

app.post('/auth', async (req, res) => {
  const {nickname,password,selectedValue} = req.body;
  if(selectedValue=='login'){
  try {
    let userFound = await Kullanici.findOne({ nick:nickname, password});
    if (userFound) {
      req.session.user = userFound;
      req.session.userId = userFound._id;
      console.log("Oturum Başarıyla Kaydedildi! Kullanıcı:", req.session.user.nick);
      return res.json({ success: true, userId: userFound._id });
    } else {
      return res.json({ success: false, message: 'Kayıtlı değilsin veya bilgiler hatalı.' });
    }
  } catch (error) {
    console.error('Kayıt / Giriş hatası:', error);
    return res.json({ success: false, message: 'Sunucu hatası' });
  }
}else if(selectedValue=='register'){
    try {const {email,password2} = req.body;
    console.log(nickname+password+email)
    let userFound = await Kullanici.findOne({ nick:nickname, password});
    if (userFound) {
      return res.json({ success: false, message: 'Bu kullanıcı adı veya e-posta adresi zaten kullanımda!' })
    } else {
     let verificationCode = Math.floor(100000 + Math.random() * 900000);
      req.session.pendingUser = {
                nickname,
                email,
                password,
                code: verificationCode
        };
        await sendEmail(email, verificationCode);
        return res.json({ 
                success: true, 
                redirect: '/verify-code' 
        });
    }
  } catch (error) {
    console.error('Register hatası:', error);
    return res.json({ success: false, message: 'Sunucu hatası' });
  }
}

});

app.get('/verify-code', (req, res) => {
    if (!req.session.pendingUser) {
        return res.redirect('/login');
    }
  res.render('main', {
            content: 'email', 
            style: 'payment.css'
        });
});
app.post('/verify-code', async (req, res) => {
    const { code } = req.body;
    const pending = req.session.pendingUser;

    if (!pending) {
        return res.json({ success: false, message: 'Oturum süreniz dolmuş. Lütfen tekrar kayıt olun.' });
    }

    if (pending.code == code) {
        try {
            const newUser = new Kullanici({
                nick: pending.nickname,
                email: pending.email,
                password: pending.password,
                kayitTarihi: new Date()
            });
            await newUser.save();
            req.session.user = newUser;
            req.session.userId = newUser._id;
            delete req.session.pendingUser;

           return res.redirect('/');
        } catch (error) {
            console.error("Veritabanı Kayıt Hatası:", error);
            return res.status(500).json({ success: false, message: 'Kullanıcı kaydedilemedi.' });
        }
    } else {
        return res.json({ success: false, message: 'Girdiğiniz doğrulama kodu hatalı!' });
    }
});
function formatAd(metin) {
    if (!metin) return metin;
    return metin.split(' ')
                .map(kelime => kelime.charAt(0).toUpperCase() + kelime.slice(1).toLowerCase())
                .join(' ');
}
app.get('/',async(req,res)=>{
  const games =await category.find()
   res.render('main',{
      games,
      content:'home',
      style:'store.css'
   })
})

app.get('/uploadcheat2',isAdmin1, async (req, res) => {
    const games = await category.find(); // Kategori listesini çek
    res.render('main', {
        games, // Formdaki select için gerekli
        content: 'upladncheat',
        style: 'store.css'
    });
});
app.get('/uploadcheat',isAdmin1,async(req,res)=>{
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
    try {
        if (!req.query.cart) return res.status(400).send("Sepet boş veya geçersiz yönlendirme!");
        
        const cartArray = JSON.parse(req.query.cart); // Frontend'den gelen [{id, title, qty}] dizisi
        const wallets = {
            ltc: process.env.LTC_WALLET_ADDRESS,
            usdt: process.env.USDT_WALLET_ADDRESS,
            btc: process.env.BTC_WALLET_ADDRESS,
            xmr: process.env.XMR_WALLET_ADDRESS
        };
        
        let totalPrice = 0;
        let verifiedItems = []; // EJS sayfasına göndereceğimiz güvenli ürün listesi

        // Sepetteki her bir ürünü DB'den bul ve fiyatını hesapla
        for (let item of cartArray) {
            const product = await cheat.findById(item.id);
            if (!product) continue;
            
            const selectedPackage = product.Price.find(p => p.PriceTitle === item.title);
            if (selectedPackage) {
                const itemTotal = selectedPackage.Price * item.qty;
                totalPrice += itemTotal;
                
                verifiedItems.push({
                    cheatId: product._id,
                    cheatName: product.CheatName,
                    packageTitle: selectedPackage.PriceTitle,
                    price: selectedPackage.Price,
                    qty: item.qty,
                    itemTotal: itemTotal
                });
            }
        }

        if (verifiedItems.length === 0) return res.status(404).send("Geçerli hile bulunamadı!");

        res.render('main', {
            content: 'order', 
            style: 'payment.css',
            items: verifiedItems, // Artık EJS'ye tek ürün değil, Ürünler Dizisi yolluyoruz
            totalPrice: totalPrice, // Sepetin Toplam Tutarı
            wallets: wallets,
            cartDataRaw: req.query.cart // Bunu formu postlarken kullanacağız
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("Ödeme sayfası yüklenirken bir hata oluştu.");
    }
});
app.post('/submit-payment', validateTxid, async (req, res) => {
    try {
        // Formdan gizli input ile cartDataRaw'ı (JSON) çekiyoruz
        const { cartDataRaw, txid, method, email } = req.body; 
        if (!cartDataRaw) return res.status(400).send("Sepet verisi bulunamadı!");

        const cartArray = JSON.parse(cartDataRaw);
        
        let totalDbPriceUSD = 0;
        let orderItems = [];

        // Güvenlik: Toplam fiyatı yine DB'den hesaplıyoruz!
        for (let item of cartArray) {
            const product = await cheat.findById(item.id);
            if (!product) continue;
            const selectedPackage = product.Price.find(p => p.PriceTitle === item.title);
            if (selectedPackage) {
                totalDbPriceUSD += (selectedPackage.Price * item.qty);
                orderItems.push({
                    cheatId: product._id,
                    cheatName: product.CheatName,
                    packageTitle: selectedPackage.PriceTitle,
                    qty: item.qty,
                    pricePaid: selectedPackage.Price
                });
            }
        }

        if (orderItems.length === 0) return res.status(400).send("Geçersiz paket/ürün seçimi!");

        const coinGeckoMap = { ltc: 'litecoin', btc: 'bitcoin', xmr: 'monero', usdt: 'tether' };
        const cryptoId = coinGeckoMap[method];
        if (!cryptoId) return res.status(400).send("Desteklenmeyen ödeme yöntemi.");

        const { data } = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=usd`);
        const currentCryptoPrice = data[cryptoId].usd; 
        
        // ÖDENMESİ GEREKEN TOPLAM KRİPTO MİKTARI
        const expectedCryptoAmount = totalDbPriceUSD / currentCryptoPrice;
        
        const result = await verifyPayment(txid, method, expectedCryptoAmount);
        if (!result.success) {
            return res.status(400).send(`Ödeme doğrulanamadı: ${result.message}`);
        }
        
        const existingOrder = await Order.findOne({ txid });
        if (existingOrder) return res.status(400).send("Bu TXID zaten kullanılmış!");
        
        // SİPARİŞİ VERİTABANINA KAYDET
        await Order.create({
            email, 
            items: orderItems, // !!! DİKKAT: Eski kodda tek cheatId vardı, artık ürünler dizisi var
            totalPriceUSD: totalDbPriceUSD,
            txid,
            method,
            status: 'completed'
        });
        
        // Müşteri satın alımı tamamladığında Frontend'deki sepeti temizlemesi için uyarı
        res.send(`
            <script>localStorage.removeItem('alone_cart');</script>
            Ödemen alındı! Toplam ${orderItems.length} kalem ürün bilgileri ${email} adresine gönderilecek.
        `);
    } catch (error) {
        console.error(error);
        res.status(500).send("Bir hata oluştu.");
    }
});
app.post('/add-cheat2',isAdmin1, CheatUpload, async (req, res) => {
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
app.post('/add-cheat',isAdmin1, KategoriUpload, async (req, res) => {
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
app.post('/cheats/add-price/:id',isAdmin1, async (req, res) => {
    const { PriceTitle, Stock, Price } = req.body;
    await cheat.findByIdAndUpdate(req.params.id, {
        $push: { Price: { PriceTitle, Stock, Price } }
    });
    res.redirect(`/cheats/${req.params.id}`);
});

app.post('/cheats/add-info/:id',isAdmin1, async (req, res) => {
    const { blockTitle,subTitle, items, } = req.body;
    const itemsArray = items.split(',').map(item => item.trim());
    
    await cheat.findByIdAndUpdate(req.params.id, {
        $push: { infoBlocks: { blockTitle,subTitle, items: itemsArray } }
    });
    res.redirect(`/cheats/${req.params.id}`);
});
app.post('/cheats/add-stock/:id',isAdmin1, async (req, res) => {
try {
     const cheatId=req.params.id
        const { priceId, keysText } = req.body;
        const keyArray = keysText
            .split(/[\n,]+/) 
            .map(k => k.trim())
            .filter(k => k.length > 0);

        if (keyArray.length === 0) {
            return res.status(400).send("Hiç geçerli key bulunamadı.");
        }

        const keysToInsert = keyArray.map(code => ({
            cheatId: cheatId,
            priceId: priceId,
            keyCode: code,
            isUsed: false
        }));
        const insertedKeys = await Key.insertMany(keysToInsert, { ordered: false });

        const cheatItem = await cheat.findById(cheatId);
        if (cheatItem) {
            const priceItem = cheatItem.Price.id(priceId);
            if (priceItem) {
                priceItem.Stock = (priceItem.Stock || 0) + insertedKeys.length;
                await cheatItem.save();
            }
        }
        res.send(`${insertedKeys.length} adet Key başarıyla eklendi ve stok güncellendi!`);

    } catch (error) {
        if (error.code === 11000) {
            res.send("Keyler eklendi ancak metin kutusunda zaten veritabanında olan bazı keyler atlandı.");
        } else {
            console.error("Key ekleme hatası:", error);
            res.status(500).send("Sunucu hatası oluştu.");
        }
    }
});
app.post('/cheats/change-price/:id',isAdmin1, async (req, res) => {
try {
        const { priceId, nprice } = req.body;
        const newprice = parseInt(nprice, 10) || 0;
        const cheatItem = await cheat.findById(req.params.id);
        if (!cheatItem) {
            return res.status(404).send("Ürün bulunamadı.");
        }
        const priceItem = cheatItem.Price.id(priceId); 
        if (priceItem) {
            priceItem.Price = newprice
            await cheatItem.save();
        }
        res.redirect(`/cheats/${req.params.id}`);
    } catch (error) {
        console.error("Stok artırılırken hata oluştu:", error);
        res.status(500).send("Stok güncellenemedi.");
    }
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
