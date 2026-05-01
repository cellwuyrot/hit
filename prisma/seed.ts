import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "..", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

function slug(name: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
    з: "z", и: "i", й: "j", к: "k", л: "l", м: "m", н: "n", о: "o",
    п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c",
    ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  return name.toLowerCase().split("").map(c => map[c] || c).join("")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function main() {
  // Admin
  const hashedPassword = await bcrypt.hash("admin123", 10);
  await prisma.admin.upsert({
    where: { username: "admin" },
    update: {},
    create: { username: "admin", password: hashedPassword },
  });

  // Top-level categories
  const cats = [
    { name: "Продукты питания", icon: "🍎", order: 1 },
    { name: "Бытовая химия", icon: "🧴", order: 2 },
    { name: "Электроника", icon: "📱", order: 3 },
    { name: "Садоводство", icon: "🌱", order: 4 },
  ];

  const topCats: Record<string, string> = {};
  for (const c of cats) {
    const s = slug(c.name);
    const cat = await prisma.category.upsert({
      where: { slug: s },
      update: {},
      create: { name: c.name, slug: s, icon: c.icon, order: c.order },
    });
    topCats[c.name] = cat.id;
  }

  // Subcategories
  const subCats: Record<string, { name: string; parent: string }[]> = {
    "Продукты питания": [
      { name: "Напитки", parent: "Продукты питания" },
      { name: "Молочные продукты", parent: "Продукты питания" },
      { name: "Хлеб и выпечка", parent: "Продукты питания" },
      { name: "Мясо и птица", parent: "Продукты питания" },
      { name: "Крупы и макароны", parent: "Продукты питания" },
      { name: "Кондитерские изделия", parent: "Продукты питания" },
      { name: "Консервы", parent: "Продукты питания" },
      { name: "Замороженные продукты", parent: "Продукты питания" },
    ],
    "Бытовая химия": [
      { name: "Стиральные средства", parent: "Бытовая химия" },
      { name: "Чистящие средства", parent: "Бытовая химия" },
      { name: "Средства для посуды", parent: "Бытовая химия" },
      { name: "Средства для уборки", parent: "Бытовая химия" },
      { name: "Средства гигиены", parent: "Бытовая химия" },
    ],
    "Электроника": [
      { name: "Смартфоны", parent: "Электроника" },
      { name: "Наушники и аудио", parent: "Электроника" },
      { name: "Аксессуары", parent: "Электроника" },
      { name: "Зарядные устройства", parent: "Электроника" },
      { name: "Умный дом", parent: "Электроника" },
    ],
    "Садоводство": [
      { name: "Семена", parent: "Садоводство" },
      { name: "Удобрения", parent: "Садоводство" },
      { name: "Садовый инструмент", parent: "Садоводство" },
      { name: "Горшки и кашпо", parent: "Садоводство" },
      { name: "Системы полива", parent: "Садоводство" },
    ],
  };

  const allCats: Record<string, string> = { ...topCats };
  for (const [parentName, subs] of Object.entries(subCats)) {
    let order = 1;
    for (const sub of subs) {
      const s = slug(sub.name);
      const cat = await prisma.category.upsert({
        where: { slug: s },
        update: {},
        create: { name: sub.name, slug: s, order: order++, parentId: topCats[parentName] },
      });
      allCats[sub.name] = cat.id;
    }
  }

  // Products
  const products = [
    // Напитки
    { name: "Вода минеральная 1.5л", price: 45, oldPrice: 55, inStock: 200, brand: "Боржоми", cat: "Напитки", type: "газированная" },
    { name: "Сок апельсиновый 1л", price: 120, inStock: 80, brand: "Добрый", cat: "Напитки", type: "сок" },
    { name: "Кола 0.5л", price: 75, oldPrice: 90, inStock: 150, brand: "Coca-Cola", cat: "Напитки", type: "газированная" },
    // Молочные
    { name: "Молоко 3.2% 1л", price: 85, inStock: 100, brand: "Простоквашино", cat: "Молочные продукты", type: "молоко" },
    { name: "Творог 5% 200г", price: 95, oldPrice: 110, inStock: 60, brand: "Домик в деревне", cat: "Молочные продукты", type: "творог" },
    // Хлеб
    { name: "Хлеб белый нарезной", price: 42, inStock: 50, brand: "Хлебозавод №1", cat: "Хлеб и выпечка", type: "хлеб" },
    { name: "Батон нарезной", price: 38, inStock: 40, brand: "Хлебозавод №1", cat: "Хлеб и выпечка", type: "хлеб" },
    // Мясо
    { name: "Куриное филе 1кг", price: 350, oldPrice: 420, inStock: 30, brand: "Мираторг", cat: "Мясо и птица", type: "птица" },
    { name: "Фарш говяжий 500г", price: 280, inStock: 25, brand: "Мираторг", cat: "Мясо и птица", type: "говядина" },
    // Крупы
    { name: "Рис длиннозёрный 900г", price: 95, inStock: 100, brand: "Мистраль", cat: "Крупы и макароны", type: "крупа" },
    { name: "Макароны спагетти 500г", price: 75, oldPrice: 85, inStock: 120, brand: "Barilla", cat: "Крупы и макароны", type: "макароны" },
    // Кондитерские
    { name: "Шоколад молочный 100г", price: 110, inStock: 200, brand: "Alpen Gold", cat: "Кондитерские изделия", type: "шоколад" },
    { name: "Печенье овсяное 300г", price: 85, oldPrice: 95, inStock: 80, brand: "Любятово", cat: "Кондитерские изделия", type: "печенье" },
    // Бытовая химия
    { name: "Стиральный порошок 3кг", price: 450, oldPrice: 550, inStock: 40, brand: "Persil", cat: "Стиральные средства", type: "порошок" },
    { name: "Гель для стирки 1.5л", price: 380, inStock: 50, brand: "Tide", cat: "Стиральные средства", type: "гель" },
    { name: "Средство для мытья посуды 500мл", price: 120, inStock: 100, brand: "Fairy", cat: "Средства для посуды", type: "жидкость" },
    { name: "Чистящий спрей универсальный", price: 180, oldPrice: 220, inStock: 60, brand: "Mr. Proper", cat: "Чистящие средства", type: "спрей" },
    { name: "Средство для пола 1л", price: 150, inStock: 45, brand: "Mr. Proper", cat: "Средства для уборки", type: "жидкость" },
    // Электроника
    { name: "Наушники беспроводные", price: 2500, oldPrice: 3200, inStock: 15, brand: "JBL", cat: "Наушники и аудио", type: "наушники" },
    { name: "Зарядное устройство USB-C", price: 850, inStock: 30, brand: "Samsung", cat: "Зарядные устройства", type: "зарядка" },
    { name: "Чехол для смартфона", price: 450, oldPrice: 600, inStock: 50, brand: "Universal", cat: "Аксессуары", type: "чехол" },
    { name: "Умная лампочка Wi-Fi", price: 1200, inStock: 20, brand: "Yeelight", cat: "Умный дом", type: "освещение" },
    // Садоводство
    { name: "Семена томатов Черри", price: 65, inStock: 100, brand: "Гавриш", cat: "Семена", type: "овощи" },
    { name: "Семена огурцов", price: 55, oldPrice: 70, inStock: 80, brand: "Аэлита", cat: "Семена", type: "овощи" },
    { name: "Удобрение универсальное 1кг", price: 250, inStock: 40, brand: "Фертика", cat: "Удобрения", type: "минеральное" },
    { name: "Секатор садовый", price: 650, oldPrice: 800, inStock: 20, brand: "Fiskars", cat: "Садовый инструмент", type: "инструмент" },
    { name: "Горшок керамический 3л", price: 350, inStock: 35, brand: "Lechuza", cat: "Горшки и кашпо", type: "горшок" },
    { name: "Шланг поливочный 15м", price: 1200, oldPrice: 1500, inStock: 15, brand: "Gardena", cat: "Системы полива", type: "полив" },
  ];

  for (const p of products) {
    const s = slug(p.name);
    const catId = allCats[p.cat];
    if (!catId) { console.log(`Category not found: ${p.cat}`); continue; }
    await prisma.product.upsert({
      where: { slug: s },
      update: {},
      create: {
        name: p.name, slug: s, price: p.price, oldPrice: p.oldPrice ?? null,
        inStock: p.inStock, brand: p.brand, categoryId: catId,
        productType: p.type, description: `${p.name} — ${p.brand}`,
      },
    });
  }

  // Slider images
  const existingSlides = await prisma.sliderImage.findMany();
  if (existingSlides.length === 0) {
    const slidesData = [
      { title: "Весенние скидки до 30%", subtitle: "На продукты питания и бытовую химию", imageUrl: "/slider/slide1.svg", link: "/catalog/produkty-pitaniya", order: 1 },
      { title: "Новинки электроники", subtitle: "Умный дом и аксессуары", imageUrl: "/slider/slide2.svg", link: "/catalog/elektronika", order: 2 },
      { title: "Бесплатная доставка", subtitle: "При заказе от 3 000 руб.", imageUrl: "/slider/slide3.svg", link: "/catalog", order: 3 },
    ];
    for (const slide of slidesData) {
      await prisma.sliderImage.create({ data: slide });
    }
  }

  // Sample news
  const newsItems = [
    {
      title: "Открытие нового магазина ТОПХИТ",
      content: "<p>Рады сообщить об открытии нового магазина <strong>ТОПХИТ</strong> в Москве!</p><p>Приглашаем всех на торжественное открытие. В первые дни работы — скидки до <strong>20%</strong> на весь ассортимент.</p><p>Подробнее: <a href='/catalog'>перейти в каталог</a></p>",
      published: true,
    },
    {
      title: "Акция: скидки на бытовую химию",
      content: "<p>Только на этой неделе — скидки до <strong>30%</strong> на все средства для стирки и уборки.</p><p>Успейте воспользоваться выгодным предложением!</p><p><a href='/catalog/bytovaya-himiya'>Смотреть товары со скидкой →</a></p>",
      published: true,
    },
    {
      title: "Новый раздел: Садоводство",
      content: "<p>Мы расширили ассортимент! Теперь у нас доступны товары для сада и огорода:</p><ul><li>Семена овощей и цветов</li><li>Удобрения</li><li>Садовый инструмент</li><li>Системы полива</li></ul><p><a href='/catalog/sadovodstvo'>Перейти в раздел →</a></p>",
      published: true,
    },
  ];

  for (const n of newsItems) {
    const s = slug(n.title);
    await prisma.news.upsert({
      where: { slug: s },
      update: {},
      create: { title: n.title, slug: s, content: n.content, published: n.published },
    });
  }

  console.log("Seed completed successfully");
}

main().then(() => prisma.$disconnect()).catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
