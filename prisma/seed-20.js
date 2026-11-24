const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PRODUCTS = [
  // 1. เค้ก & ทาร์ต (Cakes & Tarts)
  {
    name: "Dark Chocolate Fudge Layer Cake",
    description: "เลเยอร์เค้กดาร์กช็อกโกแลตเข้มข้น 70% ราดกานาชเนื้อเนียน สอดไส้ครีมฟัดจ์นุ่มละมุน",
    price: 165,
    stock: 15,
    sold: 68,
    category: "เค้ก & ทาร์ต",
    imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=800&auto=format&fit=crop"
  },
  {
    name: "Basque Burnt Cheesecake",
    description: "บาสก์ชีสเค้กหน้าไหม้สูตรสเปน ครีมชีสแท้เข้มข้น เนื้อสัมผัสนุ่มละลายในปาก",
    price: 145,
    stock: 12,
    sold: 82,
    category: "เค้ก & ทาร์ต",
    imageUrl: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=800&auto=format&fit=crop"
  },
  {
    name: "Lemon Meringue Tart",
    description: "ทาร์ตมะนาวเลมอนเคิร์ดเปรี้ยวอมหวานสดชื่น ท็อปด้วยเมอแรงค์เบิร์นไฟหอมกรุ่น",
    price: 155,
    stock: 10,
    sold: 54,
    category: "เค้ก & ทาร์ต",
    imageUrl: "https://images.unsplash.com/photo-1519869325930-281384150729?q=80&w=800&auto=format&fit=crop"
  },
  {
    name: "Fresh Strawberry Shortcake",
    description: "เค้กสตรอว์เบอร์รีสดสไตล์ญี่ปุ่น สปันจ์เค้กนุ่มฟู แทรกชั้นด้วยวิปครีมสดแท้และสตรอว์เบอร์รีฉ่ำ",
    price: 160,
    stock: 8,
    sold: 91,
    category: "เค้ก & ทาร์ต",
    imageUrl: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=800&auto=format&fit=crop"
  },
  {
    name: "Blueberry Crumble Tart",
    description: "ทาร์ตบลูเบอร์รีสดแน่นเต็มคำ โรยครัมเบิลเนยสดกรุบกรอบ หวานซ่อนเปรี้ยวลงตัว",
    price: 150,
    stock: 14,
    sold: 47,
    category: "เค้ก & ทาร์ต",
    imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=800&auto=format&fit=crop"
  },

  // 2. คุกกี้ & บราวนี่ (Cookies & Brownies)
  {
    name: "Double Chocolate Walnut Soft Cookie",
    description: "ซอฟต์คุกกี้ดับเบิ้ลช็อกโกแลตหนึบหนับ ผสมถั่ววอลนัทอบกรอบและช็อกโกแลตชิปเยิ้มๆ",
    price: 75,
    stock: 20,
    sold: 63,
    category: "คุกกี้ & บราวนี่",
    imageUrl: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=800&auto=format&fit=crop"
  },
  {
    name: "Macadamia White Chocolate Cookie",
    description: "คุกกี้นิ่มเนยสดแท้ อัดแน่นด้วยถั่วแมคคาเดเมียเกรดพรีเมียม ตัดกับความหวานนุ่มของไวท์ช็อกโกแลต",
    price: 80,
    stock: 18,
    sold: 76,
    category: "คุกกี้ & บราวนี่",
    imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=800&auto=format&fit=crop"
  },
  {
    name: "Signature Fudge Brownie",
    description: "บราวนี่ฟัดจ์เนื้อหนึบเข้มข้น ดาร์กช็อกโกแลตพรีเมียม หน้าฟิล์มกรอบ เนื้อฉ่ำ",
    price: 65,
    stock: 25,
    sold: 110,
    category: "คุกกี้ & บราวนี่",
    imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=800&auto=format&fit=crop"
  },
  {
    name: "Matcha White Chocolate Brookie",
    description: "ลูกผสมระหว่างบราวนี่มัทฉะอุจิเข้มข้นและคุกกี้ไวท์ช็อกโกแลต กรอบนอกหนึบใน",
    price: 75,
    stock: 16,
    sold: 58,
    category: "คุกกี้ & บราวนี่",
    imageUrl: "https://images.unsplash.com/photo-1621236378699-8597fee6a1ce?q=80&w=800&auto=format&fit=crop"
  },
  {
    name: "Salted Caramel Pecan Cookie",
    description: "คุกกี้เนยสดผสมถั่วพีแคน สอดไส้ซอลท์เต็ดคาราเมลโฮมเมดเยิ้ม หอมมันหวานเค็มกลมกล่อม",
    price: 80,
    stock: 15,
    sold: 52,
    category: "คุกกี้ & บราวนี่",
    imageUrl: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?q=80&w=800&auto=format&fit=crop"
  },

  // 3. ชูครีม & พัฟ (Choux & Pastries)
  {
    name: "Vanilla Bean Custard Choux",
    description: "ชูครีมวานิลลาแท้สอดไส้คัสตาร์ดสดผสมเมล็ดฝักวานิลลามาดากัสการ์ หอมหวานละมุน นุ่มละลายในปาก",
    price: 65,
    stock: 19,
    sold: 53,
    category: "ชูครีม & พัฟ",
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800&auto=format&fit=crop"
  },
  {
    name: "Matcha Kyoto Cream Choux Bun",
    description: "ชูครีมแป้งกรอบสไตล์คราเคอลิน สอดไส้ครีมมัทฉะเกียวโตแท้ รสชาติเข้มข้นอมขมปลายลิ้น",
    price: 75,
    stock: 14,
    sold: 49,
    category: "ชูครีม & พัฟ",
    imageUrl: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=800&auto=format&fit=crop"
  },
  {
    name: "Chocolate Hazelnut Craquelin",
    description: "ชูคราเคอลินกรอบนอก สอดไส้ครีมช็อกโกแลตเฮเซลนัทพราลีนบดละเอียด หอมมันเข้มข้น",
    price: 80,
    stock: 12,
    sold: 61,
    category: "ชูครีม & พัฟ",
    imageUrl: "https://images.unsplash.com/photo-1579372786545-d24232daf58c?q=80&w=800&auto=format&fit=crop"
  },
  {
    name: "Raspberry Earl Grey Choux",
    description: "ครีมชูชาร์ปชาเอิร์ลเกรย์หอมกลิ่นเบอร์กามอต ผสานซอสราสเบอร์รีสดรสเปรี้ยวจี๊ดจ๊าด",
    price: 85,
    stock: 10,
    sold: 39,
    category: "ชูครีม & พัฟ",
    imageUrl: "https://images.unsplash.com/photo-1508737027454-e6454ef45afd?q=80&w=800&auto=format&fit=crop"
  },

  // 4. ครัวซองต์ & ขนมปัง (Croissants & Breads)
  {
    name: "Artisanal French Butter Croissant",
    description: "ครัวซองต์เนยฝรั่งเศส AOP แท้ พับชั้นแป้งพิถีพิถัน กรอบนอกนุ่มใน หอมเนยฟุ้งทุกคำ",
    price: 75,
    stock: 22,
    sold: 125,
    category: "ครัวซองต์ & ขนมปัง",
    imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=800&auto=format&fit=crop"
  },
  {
    name: "Pain au Chocolat",
    description: "ขนมปังเดนิชสอดไส้แท่งดาร์กช็อกโกแลตเบลเยียม 2 แท่ง แป้งฟูกรอบหอมละมุน",
    price: 85,
    stock: 16,
    sold: 94,
    category: "ครัวซองต์ & ขนมปัง",
    imageUrl: "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?q=80&w=800&auto=format&fit=crop"
  },
  {
    name: "Almond Frangipane Croissant",
    description: "ครัวซองต์ไส้ครีมอัลมอนด์ฟรังจิปาน หอมหวานนุ่มนวล โรยหน้าด้วยอัลมอนด์สไลซ์อบกรอบ",
    price: 95,
    stock: 14,
    sold: 72,
    category: "ครัวซองต์ & ขนมปัง",
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800&auto=format&fit=crop"
  },
  {
    name: "Hokkaido Milk Brioche",
    description: "ขนมปังบริยอชนมสดฮอกไกโด นวดด้วยเนยสดแท้ เนื้อสัมผัสนุ่มดุจปุยเมฆ ชุ่มฉ่ำ",
    price: 70,
    stock: 18,
    sold: 88,
    category: "ครัวซองต์ & ขนมปัง",
    imageUrl: "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?q=80&w=800&auto=format&fit=crop"
  },

  // 5. มาการอง & เซ็ตของขวัญ (Macarons & Gift Sets)
  {
    name: "Pastel Macaron Box (Set of 6)",
    description: "เซ็ตมาการองพาสเทล 6 รสชาติซิกเนเจอร์: วานิลลา, ช็อกโกแลต, ราสเบอร์รี, พิสตาชิโอ, คาราเมล, ยูซุ",
    price: 240,
    stock: 15,
    sold: 83,
    category: "มาการอง & เซ็ตของขวัญ",
    imageUrl: "https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=800&auto=format&fit=crop"
  },
  {
    name: "Signature Treat Box (Holiday Gift Edition)",
    description: "กล่องของขวัญรวมขนมซิกเนเจอร์: บราวนี่ฟัดจ์ 2 ชิ้น, ซอฟต์คุกกี้ 2 ชิ้น และมาการองพาสเทล 4 ชิ้น บรรจุในกล่องสุดหรูพร้อมริบบิ้น",
    price: 420,
    stock: 10,
    sold: 53,
    category: "มาการอง & เซ็ตของขวัญ",
    imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=800&auto=format&fit=crop"
  }
];

async function seed() {
  console.log("Seeding 20 artisanal bakery products...");
  // Clear existing images and products cleanly
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();

  for (let i = 0; i < PRODUCTS.length; i++) {
    const item = PRODUCTS[i];
    const product = await prisma.product.create({
      data: {
        name: item.name,
        description: item.description,
        price: item.price,
        stock: item.stock,
        initialStock: item.stock + item.sold,
        sold: item.sold,
        category: item.category,
        status: "ACTIVE",
        images: {
          create: [
            {
              imageUrl: item.imageUrl,
              isPrimary: true,
              displayOrder: 0
            }
          ]
        }
      }
    });
    console.log(`[${i + 1}/20] Created: ${product.name} (฿${product.price}) - Sold: ${product.sold}`);
  }

  console.log("Seeding completed successfully! 20 items active.");
}

seed()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
