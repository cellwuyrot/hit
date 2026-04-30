import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "..", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);
  await prisma.admin.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: hashedPassword,
    },
  });

  const cat1 = await prisma.category.upsert({
    where: { slug: "bytovaya-himiya" },
    update: {},
    create: { name: "Бытовая химия", slug: "bytovaya-himiya", order: 1 },
  });

  const cat2 = await prisma.category.upsert({
    where: { slug: "instrumenty" },
    update: {},
    create: { name: "Инструменты", slug: "instrumenty", order: 2 },
  });

  const cat3 = await prisma.category.upsert({
    where: { slug: "kraski" },
    update: {},
    create: { name: "Краски и лаки", slug: "kraski", order: 3 },
  });

  const cat4 = await prisma.category.upsert({
    where: { slug: "stroymaterialy" },
    update: {},
    create: { name: "Стройматериалы", slug: "stroymaterialy", order: 4 },
  });

  const products = [
    { name: "Удалитель наклеек Kudo аэрозоль 400 мл", slug: "udalitel-nakleek-kudo", price: 654, inStock: 25, brand: "Kudo", productType: "Удалители, очистители", categoryId: cat1.id },
    { name: "Очиститель Diamant+ Extra для эпоксидной затирки", slug: "ochistitel-diamant-extra", price: 2230, inStock: 48, brand: "Diamant", productType: "Удалители, очистители", categoryId: cat1.id },
    { name: "Очиститель Diamant+ Light для эпоксидной затирки", slug: "ochistitel-diamant-light", price: 1050, inStock: 108, brand: "Diamant", productType: "Удалители, очистители", categoryId: cat1.id },
    { name: "Очиститель Diamant+ для эпоксидной затирки концентрат", slug: "ochistitel-diamant-konc", price: 1500, inStock: 106, brand: "Diamant", productType: "Удалители, очистители", categoryId: cat1.id },
    { name: "Растворитель универсальный 1 л", slug: "rastvoritel-universalnyj", price: 320, inStock: 50, brand: "Lakra", productType: "Растворители", categoryId: cat1.id },
    { name: "Антисептик для дерева 5 л", slug: "antiseptik-dlya-dereva", price: 890, inStock: 30, brand: "Neomid", productType: "Антисептические составы", categoryId: cat1.id },
    { name: "Молоток слесарный 500 г", slug: "molotok-slesarnyy", price: 450, inStock: 40, brand: "Parade", productType: "Ручной инструмент", categoryId: cat2.id },
    { name: "Набор отвёрток 6 шт", slug: "nabor-otvyortok", price: 780, inStock: 25, brand: "Tytan", productType: "Ручной инструмент", categoryId: cat2.id },
    { name: "Краска акриловая белая 10 л", slug: "kraska-akrilovaya-belaya", price: 2800, inStock: 60, brand: "Pufas", productType: "Краски", categoryId: cat3.id },
    { name: "Лак паркетный полуматовый 2.5 л", slug: "lak-parketnyj", price: 1950, inStock: 35, brand: "Pufas", productType: "Лаки", categoryId: cat3.id },
    { name: "Грунтовка глубокого проникновения 10 л", slug: "gruntovka-glubokogo", price: 650, inStock: 80, brand: "Церезит", productType: "Грунтовки", categoryId: cat3.id },
    { name: "Цемент М500 50 кг", slug: "cement-m500", price: 480, inStock: 200, brand: "Здоровый дом", productType: "Цемент", categoryId: cat4.id },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });
  }

  const existingSlides = await prisma.sliderImage.findMany();
  if (existingSlides.length === 0) {
    const slidesData = [
      { title: "Весенние скидки до 30%", subtitle: "На все краски и лаки", imageUrl: "/slider/slide1.svg", link: "/catalog/kraski", order: 1 },
      { title: "Новое поступление инструментов", subtitle: "Профессиональное качество", imageUrl: "/slider/slide2.svg", link: "/catalog/instrumenty", order: 2 },
      { title: "Бесплатная доставка", subtitle: "При заказе от 5 000 руб.", imageUrl: "/slider/slide3.svg", link: "/catalog", order: 3 },
    ];
    for (const slide of slidesData) {
      await prisma.sliderImage.create({ data: slide });
    }
  }

  console.log("Seed completed successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
