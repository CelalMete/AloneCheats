const mongoose = require("mongoose");
require("dotenv").config();

// Modelleri içeri alıyoruz
const Game = require("./public/models/category");

const seedKategori = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Veritabanına bağlanıldı!");
            valorant = await Game.create({
                GameName: "Valorant",
                GameIcon: "https://user-generated-content.komerza.com/cdedd1b0-6e98-4431-a833-144ff80a0e38.png" // İleride arayüzde kullanacağın logo yolu
            })
            console.log("🚀 Yeni oyun/kategori oluşturuldu!");
     
        // 3. Elle ekleme yapabilmen için ID'yi ekrana kocaman yazdır
        console.log("---------------------------------------------------");
        console.log("OYUN ADI     :", valorant.GameName);
        console.log("KATEGORİ ID  :", valorant._id.toString());
        console.log("---------------------------------------------------");
        console.log("Lütfen bu ID'yi kopyalayıp MongoDB Atlas'ta hilenin 'categoryId' kısmına yapıştır.");

    } catch (error) {
        console.error("❌ Hata oluştu:", error);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
};

seedKategori();