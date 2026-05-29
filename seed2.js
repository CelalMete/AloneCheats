const mongoose = require("mongoose");
require("dotenv").config();
const category = require('./public/models/category')
const Cheat = require('./public/models/cheatmodel');

const seedRust = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Veritabanına bağlanıldı!");

        // 1. ADIM: "Rust" Kategorisini bul veya yoksa oluştur
        let rustCategory = await category.findById('6a0d8c470d19214778d8a37b');
        
        if (!rustCategory) {
            rustCategory = await Game.create({
                GameName: "Rust",
                GameIcon: "/images/rust-logo.png" // Anasayfa için oyun ikonu
            });
            console.log("🚀 Rust kategorisi başarıyla oluşturuldu!");
        } else {
            console.log("ℹ️ Rust kategorisi zaten mevcut, hile bu kategoriye ekleniyor...");
        }
        const rustCheatVerisi = {
            CheatName: "Rust Private Script",
            Photo: "https://user-generated-content.komerza.com/8c4aec09-349d-4934-96a2-0cf64ea2cfc1.jpg", // Örnek Ana Resim
            Photos: [
                "https://user-generated-content.komerza.com/860339d8-0b10-4a93-a8d8-846608465c31.webp", // Slider 1
                "https://user-generated-content.komerza.com/66359896-e696-4fd3-bcec-9fb353c8da42.webp" ,
                "https://user-generated-content.komerza.com/1a079077-caff-40c1-9d93-db6f129091ee.webp",
               "https://user-generated-content.komerza.com/8c71a047-3285-4ffb-ba8e-2a7c015d9051.webp"
            ],
            
            categoryId: rustCategory._id, // Hileyi otomatik olarak Rust oyununa bağlıyoruz
            
            Price: [
                { PriceTitle: "1 DAY", Stock: 15, Price: 6.99 },
                { PriceTitle: "7 DAY", Stock: 8, Price: 12.99 },
                { PriceTitle: "30 DAY", Stock: 3, Price: 24.99 },
                { PriceTitle: "LIFETIME + LIFETEME PERM OR 30DAY TEMP", Stock: 5, Price: 44.99 }
            ],
            
            infoBlocks: [
                {
                    blockTitle: "AIMBOT",
                    subTitle: "Advanced combat and weapon assistance.",
                    items: [
                        "Aimbot (Customizable for every weapon or global option)", 
                        "Aimbot Keybind", 
                        "Aimbot FOV", 
                        "Aimbot Smooth",
                        "Custom Hitbox Selection"
                    ]
                },
                {
                    blockTitle: "VISUALS (ESP)",
                    subTitle: "See players, loot, and bases through walls.",
                    items: [
                        "Box",
                        "Player & Sleeper ESP", 
                        "Scientist & NPC ESP", 
                        "Hidden Stash ESP", 
                        "Ore & Collectable ESP",
                        "All Agent Abilities"
                    ]
                },
                {
                    blockTitle: "MISC FEATURES",
                    subTitle: "Advanced miscellaneous enhancements.",
                    items: [
                        "Config System", 
                        "Instant Agent Lock", 
                        "Unlock All Skins (unlock all weapon skins)", 
                        "Omnisprint (Sprint in all directions)",
                        "Chat Spammer"
                    ]
                }
            ]
        };

        // 3. ADIM: Hileyi Veritabanına Kaydet
        await Cheat.create(rustCheatVerisi);
        console.log("🔥 Rust hilesi (ve ekstra galeri resimleri) başarıyla MongoDB'ye yüklendi!");

    } catch (error) {
        console.error("❌ Hata oluştu:", error);
    } finally {
        // İşlem bitince bağlantıyı kapat
        mongoose.connection.close();
        process.exit(0);
    }
};
seedRust();