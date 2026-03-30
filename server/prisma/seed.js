import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash("admin123", 10);
  const customerHash = await bcrypt.hash("customer123", 10);

  await prisma.user.upsert({
    where: { email: "estore@shop.local" },
    update: {},
    create: {
      email: "estore@shop.local",
      passwordHash: adminHash,
      name: "Velaram Patel",
      phone: "8600072801",
      role: "admin",
    },
  });

  await prisma.user.upsert({
    where: { email: "customer@demo.local" },
    update: {},
    create: {
      email: "customer@demo.local",
      passwordHash: customerHash,
      name: "Demo Customer",
      phone: "9888888888",
      role: "customer",
    },
  });

  const categories = [
    { name: "Rice & Grains", slug: "rice-grains", sortOrder: 1, description: "Rice, dal, atta" },
    { name: "Spices & Masala", slug: "spices", sortOrder: 2, description: "Whole and ground spices" },
    { name: "Oil & Ghee", slug: "oil-ghee", sortOrder: 3, description: "Cooking oils" },
    { name: "Snacks & Namkeen", slug: "snacks", sortOrder: 4, description: "Teatime snacks" },
    { name: "Beverages", slug: "beverages", sortOrder: 5, description: "Tea, coffee, drinks" },
  ];

  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, sortOrder: c.sortOrder, description: c.description },
      create: c,
    });
  }

  const cat = await prisma.category.findMany();
  const bySlug = Object.fromEntries(cat.map((x) => [x.slug, x.id]));

  const products = [
    {
      categoryId: bySlug["rice-grains"],
      name: "Sona Masoori Rice",
      slug: "sona-masoori-rice-10kg",
      description: "Popular medium-grain rice for daily meals.",
      pricePaise: 45000,
      unitLabel: "10 kg bag",
      stock: 40,
      imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400",
    },
    {
      categoryId: bySlug["rice-grains"],
      name: "Toor Dal",
      slug: "toor-dal-1kg",
      description: "Split pigeon peas for dal tadka.",
      pricePaise: 14000,
      unitLabel: "1 kg",
      stock: 60,
      imageUrl: "https://images.unsplash.com/photo-1596798831899-8155e5b6798d?w=400",
    },
    {
      categoryId: bySlug["spices"],
      name: "Turmeric Powder",
      slug: "turmeric-powder-200g",
      description: "Pure haldi powder.",
      pricePaise: 4500,
      unitLabel: "200 g",
      stock: 100,
      imageUrl: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400",
    },
    {
      categoryId: bySlug["spices"],
      name: "Red Chili Powder",
      slug: "red-chili-powder-200g",
      description: "Medium hot.",
      pricePaise: 5500,
      unitLabel: "200 g",
      stock: 80,
      imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400",
    },
    {
      categoryId: bySlug["oil-ghee"],
      name: "Mustard Oil",
      slug: "mustard-oil-1l",
      description: "Kachi ghani mustard oil.",
      pricePaise: 18000,
      unitLabel: "1 L",
      stock: 35,
      imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400",
    },
    {
      categoryId: bySlug["snacks"],
      name: "Namkeen Mix",
      slug: "namkeen-mix-400g",
      description: "Crunchy savoury mix.",
      pricePaise: 9000,
      unitLabel: "400 g",
      stock: 50,
      imageUrl: "https://images.unsplash.com/photo-1599490660738-7c5d3f23b7a0?w=400",
    },
    {
      categoryId: bySlug["beverages"],
      name: "Assam Tea",
      slug: "assam-tea-500g",
      description: "Strong chai blend.",
      pricePaise: 12000,
      unitLabel: "500 g",
      stock: 45,
      imageUrl: "https://images.unsplash.com/photo-1564890369478-c5f218732a88?w=400",
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        pricePaise: p.pricePaise,
        unitLabel: p.unitLabel,
        stock: p.stock,
        imageUrl: p.imageUrl,
        categoryId: p.categoryId,
        isActive: true,
      },
      create: p,
    });
  }

  console.log("Seed OK — admin: admin@shop.local / admin123 — customer: customer@demo.local / customer123");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
