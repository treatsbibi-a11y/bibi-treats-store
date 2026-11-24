import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧁 Seeding Bibi\'s Treats Production Database...');

  // 1. Seed Admin
  const adminPasswordHash = await bcrypt.hash('admin1234', 10);
  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: { passwordHash: adminPasswordHash },
    create: {
      username: 'admin',
      passwordHash: adminPasswordHash,
      role: 'OWNER',
    },
  });
  console.log('✅ Admin account: admin / admin1234');

  // 2. Seed Store Settings
  await prisma.storeSettings.upsert({
    where: { id: 'default' },
    update: {
      shopName: "Bibi's Treats",
      tagline: 'Artisanal Bakery & Sweet Treats ♡',
      promptpayNumber: '089-123-4567',
      promptpayName: "Bibi's Treats Cafe",
      bankName: 'ธนาคารกสิกรไทย (Kasikorn Bank)',
      bankAccountNo: '045-8-76543-2',
      bankAccountName: "บิบิ ขนมหวาน (Bibi's Treats)",
      defaultShippingFee: 40,
      isStoreOpen: true,
      announcement: 'อบสดใหม่ทุกวัน ส่งตรงถึงบ้านคุณด้วยความรัก 🧁✨ · ส่งฟรีเมื่อสั่งซื้อครบ 500 บาท',
    },
    create: {
      id: 'default',
      shopName: "Bibi's Treats",
      tagline: 'Artisanal Bakery & Sweet Treats ♡',
      logoUrl: null,
      promptpayNumber: '089-123-4567',
      promptpayName: "Bibi's Treats Cafe",
      bankName: 'ธนาคารกสิกรไทย (Kasikorn Bank)',
      bankAccountNo: '045-8-76543-2',
      bankAccountName: "บิบิ ขนมหวาน (Bibi's Treats)",
      defaultShippingFee: 40,
      isStoreOpen: true,
      announcement: 'อบสดใหม่ทุกวัน ส่งตรงถึงบ้านคุณด้วยความรัก 🧁✨ · ส่งฟรีเมื่อสั่งซื้อครบ 500 บาท',
    },
  });
  console.log('✅ Store settings initialized');

  // 3. Clear existing product images and products to avoid orphaned duplicates
  // Note: if there are orders referencing products, setNull or cascade
  console.log('🧹 Refreshing products catalog...');
  const existingProducts = await prisma.product.findMany();
  for (const p of existingProducts) {
    await prisma.productImage.deleteMany({ where: { productId: p.id } });
  }
  // Delete products that don't have orders, or update existing ones
  // To keep integrity with existing sample orders, let's upsert by name
  
  const productsData = [
    // --- 1. บราวนี่ฟัดจ์ (Fudge Brownies) ---
    {
      name: 'Signature Dark Chocolate Brownie 70%',
      description: 'บราวนี่ดาร์กช็อกโกแลตแท้ 70% นำเข้าจากเบลเยียม เนื้อฟัดจ์หนึบหนับ หน้าฟิล์มกรอบ หวานน้อยกลมกล่อม ทานเย็นก็ฉ่ำ อุ่นร้อนก็เยิ้ม',
      price: 65,
      stock: 24,
      initialStock: 40,
      sold: 56,
      category: 'บราวนี่ฟัดจ์',
      images: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=800&auto=format&fit=crop',
          isPrimary: true,
          displayOrder: 1,
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1515037893149-de7f840978e2?q=80&w=800&auto=format&fit=crop',
          isPrimary: false,
          displayOrder: 2,
        },
      ],
    },
    {
      name: 'Strawberry Cream Cheese Brownie',
      description: 'บราวนี่ช็อกโกแลตฟัดจ์สลับชั้นครีมชีสแท้จากนิวซีแลนด์ ท็อปด้วยแยมสตรอว์เบอร์รี่เคี่ยวสด รสชาติหวานอมเปรี้ยวตัดเลี่ยนอย่างลงตัว',
      price: 85,
      stock: 16,
      initialStock: 30,
      sold: 34,
      category: 'บราวนี่ฟัดจ์',
      images: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=800&auto=format&fit=crop',
          isPrimary: true,
          displayOrder: 1,
        },
      ],
    },

    // --- 2. เค้ก & ทาร์ต (Cakes & Tarts) ---
    {
      name: 'Strawberry Shortcake Fresh Cream',
      description: 'เค้กสปันจ์วานิลลานุ่มละมุน สลับชั้นครีมสดแท้ 100% สไตล์ญี่ปุ่นและสตรอว์เบอร์รี่สดลูกโต หวานเบาสบายลิ้น ละลายในปาก',
      price: 145,
      stock: 12,
      initialStock: 25,
      sold: 42,
      category: 'เค้ก & ทาร์ต',
      images: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=800&auto=format&fit=crop',
          isPrimary: true,
          displayOrder: 1,
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=800&auto=format&fit=crop',
          isPrimary: false,
          displayOrder: 2,
        },
      ],
    },
    {
      name: 'Basque Burnt Cheesecake',
      description: 'ชีสเค้กหน้าไหม้ต้นตำรับสเปน ผิวหน้าคาราเมลหอมกรุ่น เนื้อในเนียนครีมมี่เยิ้ม ฉ่ำชีสฟิลาเดลเฟียพรีเมียม',
      price: 135,
      stock: 14,
      initialStock: 25,
      sold: 38,
      category: 'เค้ก & ทาร์ต',
      images: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=800&auto=format&fit=crop',
          isPrimary: true,
          displayOrder: 1,
        },
      ],
    },
    {
      name: 'Lemon Meringue Tart',
      description: 'ทาร์ตเลมอนครีมเคิร์ดรสเปรี้ยวจี๊ดสดชื่นจากเลมอนสดแท้ ท็อปปิ้งอิตาเลียนเมอแรงก์เบิร์นไฟสีทอง บนแป้งทาร์ตเนยสดกรอบหอม',
      price: 115,
      stock: 10,
      initialStock: 20,
      sold: 28,
      category: 'เค้ก & ทาร์ต',
      images: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1519869325930-281384150729?q=80&w=800&auto=format&fit=crop',
          isPrimary: true,
          displayOrder: 1,
        },
      ],
    },
    {
      name: 'Dark Chocolate Fudge Layer Cake',
      description: 'เค้กดาร์กช็อกโกแลตเนื้อแน่นนุ่ม ราดด้วยซอสกานาชช็อกโกแลตเข้มข้น รสชาติหวานน้อยแต่ลุ่มลึก ถูกใจสายช็อกโกแลตตัวจริง',
      price: 125,
      stock: 15,
      initialStock: 25,
      sold: 30,
      category: 'เค้ก & ทาร์ต',
      images: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=800&auto=format&fit=crop',
          isPrimary: true,
          displayOrder: 1,
        },
      ],
    },

    // --- 3. ชูครีม & พัฟ (Choux & Pastries) ---
    {
      name: 'Matcha Kyoto Cream Choux Bun',
      description: 'ชูครีมสไตล์คุกกี้ชูว์ แป้งกรอบนอกนุ่มใน สอดไส้ครีมคัสตาร์ดมัทฉะเกรดพิธีการจากอูจิ เกียวโต เข้มข้นหอมชาแท้',
      price: 75,
      stock: 18,
      initialStock: 30,
      sold: 45,
      category: 'ชูครีม & พัฟ',
      images: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800&auto=format&fit=crop',
          isPrimary: true,
          displayOrder: 1,
        },
      ],
    },
    {
      name: 'Vanilla Bean Custard Choux',
      description: 'ชูครีมวานิลลาแท้สอดไส้คัสตาร์ดสดผสมเม็ดฝักวานิลลามาดากัสการ์ หอมหวานละมุน นุ่มละลายในปาก',
      price: 65,
      stock: 20,
      initialStock: 35,
      sold: 52,
      category: 'ชูครีม & พัฟ',
      images: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1612203985729-70726954388c?q=80&w=800&auto=format&fit=crop',
          isPrimary: true,
          displayOrder: 1,
        },
      ],
    },
    {
      name: 'Artisanal French Butter Croissant',
      description: 'ครัวซองต์เนยสดแท้ AOP จากฝรั่งเศส อบสดใหม่ กรอบนอก นุ่มใน ฉ่ำเนย หอมฟุ้งทุกชั้นเลเยอร์',
      price: 80,
      stock: 14,
      initialStock: 25,
      sold: 36,
      category: 'ชูครีม & พัฟ',
      images: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=800&auto=format&fit=crop',
          isPrimary: true,
          displayOrder: 1,
        },
      ],
    },

    // --- 4. ซอฟต์คุกกี้ (Soft Cookies) ---
    {
      name: 'Soft Cookie Marshmallow S\'more',
      description: 'คุกกี้นิ่มรสช็อกโกแลตสอดไส้มาร์ชเมลโลว์ยืดๆ โรยเกรแฮมแครกเกอร์กรุบกรอบ อุ่นร้อน 15 วินาทีเยิ้มสะใจ (สินค้าหมดชั่วคราว)',
      price: 55,
      stock: 0, // SOLD OUT example
      initialStock: 40,
      sold: 65,
      category: 'ซอฟต์คุกกี้',
      images: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=800&auto=format&fit=crop',
          isPrimary: true,
          displayOrder: 1,
        },
      ],
    },
    {
      name: 'Double Chocolate Walnut Soft Cookie',
      description: 'คุกกี้นิ่มรสช็อกโกแลตเข้มข้น ดาร์กช็อกโกแลตชิปเยิ้มๆ ผสานถั่ววอลนัทอบกรอบ เคี้ยวเพลิน หวานน้อยกลมกล่อม',
      price: 60,
      stock: 22,
      initialStock: 35,
      sold: 38,
      category: 'ซอฟต์คุกกี้',
      images: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=800&auto=format&fit=crop',
          isPrimary: true,
          displayOrder: 1,
        },
      ],
    },
    {
      name: 'Macadamia White Chocolate Cookie',
      description: 'คุกกี้นิ่มเนยสดแท้ อัดแน่นด้วยถั่วแมคคาเดเมียเกรดพรีเมียมกรุบกรอบ ตัดกับรสหวานนุ่มของไวท์ช็อกโกแลตแท้',
      price: 65,
      stock: 18,
      initialStock: 30,
      sold: 29,
      category: 'ซอฟต์คุกกี้',
      images: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?q=80&w=800&auto=format&fit=crop',
          isPrimary: true,
          displayOrder: 1,
        },
      ],
    },

    // --- 5. มาการอง & เซ็ตของขวัญ (Macarons & Gift Sets) ---
    {
      name: 'Pastel Macaron Box (Set of 6)',
      description: 'เซ็ตมาการองสีพาสเทล 6 ชิ้น 6 รสชาติพรีเมียม (วานิลลา, สตรอว์เบอร์รี่, มัทฉะ, เลมอน, ช็อกโกแลต, พิสตาชิโอ) กรอบนอกนุ่มใน ไส้ครีมกานาชเข้มข้น',
      price: 195,
      stock: 15,
      initialStock: 25,
      sold: 48,
      category: 'มาการอง & เซ็ตของขวัญ',
      images: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1569864321390-dc4729f273be?q=80&w=800&auto=format&fit=crop',
          isPrimary: true,
          displayOrder: 1,
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1558024920-b41e1887dc32?q=80&w=800&auto=format&fit=crop',
          isPrimary: false,
          displayOrder: 2,
        },
      ],
    },
    {
      name: 'Signature Treat Box (Holiday Gift Edition)',
      description: 'กล่องของขวัญรวมขนมซิกเนเจอร์: บราวนี่ฟัดจ์ 2 ชิ้น, ซอฟต์คุกกี้ 2 ชิ้น และมาการองพาสเทล 4 ชิ้น บรรจุในกล่องกระดาษคราฟต์สุดหรูพร้อมริบบิ้นและการ์ดอวยพร',
      price: 420,
      stock: 8,
      initialStock: 15,
      sold: 22,
      category: 'มาการอง & เซ็ตของขวัญ',
      images: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1587668178277-295251f900ce?q=80&w=800&auto=format&fit=crop',
          isPrimary: true,
          displayOrder: 1,
        },
      ],
    },
  ];

  for (const item of productsData) {
    const existing = await prisma.product.findFirst({
      where: { name: item.name },
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          description: item.description,
          price: item.price,
          stock: item.stock,
          initialStock: item.initialStock,
          sold: item.sold,
          category: item.category,
          status: 'ACTIVE',
          images: {
            create: item.images.map((img) => ({
              imageUrl: img.imageUrl,
              isPrimary: img.isPrimary,
              displayOrder: img.displayOrder,
            })),
          },
        },
      });
      console.log(`🔄 Updated: ${item.name}`);
    } else {
      const created = await prisma.product.create({
        data: {
          name: item.name,
          description: item.description,
          price: item.price,
          stock: item.stock,
          initialStock: item.initialStock,
          sold: item.sold,
          category: item.category,
          status: 'ACTIVE',
          images: {
            create: item.images.map((img) => ({
              imageUrl: img.imageUrl,
              isPrimary: img.isPrimary,
              displayOrder: img.displayOrder,
            })),
          },
        },
      });
      console.log(`🍰 Created: ${created.name}`);
    }
  }

  // 4. Ensure sample orders exist for demo
  const sampleOrderCount = await prisma.order.count();
  if (sampleOrderCount === 0) {
    const sampleCustomer = await prisma.customer.create({
      data: {
        name: 'พิมพ์ชนก ใจดี',
        phone: '081-999-8888',
        instagram: 'pim.sweetie',
        address: '123/45 ถนนสุขุมวิท 55 แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพฯ 10110',
      },
    });

    const brownie = await prisma.product.findFirst({
      where: { name: { contains: 'Brownie' } },
    });

    if (brownie) {
      await prisma.order.create({
        data: {
          orderNumber: 'BT-0001',
          customerId: sampleCustomer.id,
          subtotal: 130,
          shippingFee: 40,
          total: 170,
          status: 'PENDING',
          note: 'ขอผูกริบบิ้นสีฟ้าสำหรับมอบเป็นของขวัญวันเกิดค่ะ 💙',
          items: {
            create: [
              {
                productId: brownie.id,
                productName: brownie.name,
                quantity: 2,
                price: brownie.price,
                subtotal: brownie.price * 2,
              },
            ],
          },
        },
      });
      console.log('📦 Sample order BT-0001 created');
    }
  }

  console.log('🎉 Database seeding completed with 14 artisanal treat products!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
