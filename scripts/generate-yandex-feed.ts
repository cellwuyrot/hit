import Database from "better-sqlite3";
import { writeFileSync } from "fs";
import path from "path";

const SITE_URL = "https://tophitt.ru";
const STORE_NAME = "ТОПХИТ";
const COMPANY_NAME = "ИП Чибисов А.С.";
const FEED_FILE = path.join(process.cwd(), "public", "yandex-feed.xml");

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

interface CategoryRow {
  id: string;
  name: string;
  parentId: string | null;
}

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  oldPrice: number | null;
  image: string;
  image2: string;
  image3: string;
  image4: string;
  inStock: number;
  brand: string;
  color: string;
  productType: string;
  country: string;
  barcode: string;
  weight: number | null;
  volume: number | null;
  packSize: number | null;
  tags: string;
  categoryId: string;
  categoryName: string;
}

function main() {
  const dbPath = path.join(process.cwd(), "dev.db");
  const db = new Database(dbPath);

  const categories = db.prepare("SELECT id, name, parentId FROM Category ORDER BY \"order\"").all() as CategoryRow[];
  const products = db.prepare(`
    SELECT p.*, c.name as categoryName
    FROM Product p
    LEFT JOIN Category c ON p.categoryId = c.id
    WHERE p.inStock > 0
  `).all() as ProductRow[];

  console.log(`Generating Yandex feed: ${categories.length} categories, ${products.length} products...`);

  const now = new Date().toISOString().replace("T", " ").slice(0, 19);

  const categoryXml = categories.map((c) => {
    const parentAttr = c.parentId ? ` parentId="${escapeXml(c.parentId)}"` : "";
    return `      <category id="${escapeXml(c.id)}"${parentAttr}>${escapeXml(c.name)}</category>`;
  }).join("\n");

  const offerXml = products.map((p) => {
    const available = p.inStock > 0 ? "true" : "false";
    const imageUrl = p.image.startsWith("http") ? p.image : `${SITE_URL}${p.image}`;
    const productUrl = `${SITE_URL}/product/${p.slug}`;

    let offer = `      <offer id="${escapeXml(p.id)}" available="${available}">
        <url>${escapeXml(productUrl)}</url>
        <price>${p.price}</price>`;

    if (p.oldPrice && p.oldPrice > p.price) {
      offer += `\n        <oldprice>${p.oldPrice}</oldprice>`;
    }

    offer += `
        <currencyId>RUR</currencyId>
        <categoryId>${escapeXml(p.categoryId)}</categoryId>`;

    if (p.image) {
      offer += `\n        <picture>${escapeXml(imageUrl)}</picture>`;
    }
    for (const img of [p.image2, p.image3, p.image4].filter(Boolean)) {
      const imgUrl = img.startsWith("http") ? img : `${SITE_URL}${img}`;
      offer += `\n        <picture>${escapeXml(imgUrl)}</picture>`;
    }

    offer += `\n        <name>${escapeXml(p.name)}</name>`;

    if (p.brand) {
      offer += `\n        <vendor>${escapeXml(p.brand)}</vendor>`;
    }

    if (p.description) {
      offer += `\n        <description>${escapeXml(p.description)}</description>`;
    }

    if (p.barcode) {
      offer += `\n        <barcode>${escapeXml(p.barcode)}</barcode>`;
    }

    if (p.weight) {
      offer += `\n        <weight>${p.weight}</weight>`;
    }

    if (p.country) {
      offer += `\n        <country_of_origin>${escapeXml(p.country)}</country_of_origin>`;
    }

    if (p.packSize) {
      offer += `\n        <param name="Кол-во в упаковке">${p.packSize}</param>`;
    }

    if (p.color) {
      offer += `\n        <param name="Цвет">${escapeXml(p.color)}</param>`;
    }

    if (p.volume) {
      offer += `\n        <param name="Объём">${p.volume} л</param>`;
    }

    offer += `\n        <store>true</store>`;
    offer += `\n        <pickup>true</pickup>`;
    offer += `\n        <delivery>true</delivery>`;

    offer += `\n      </offer>`;
    return offer;
  }).join("\n");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE yml_catalog SYSTEM "shops.dtd">
<yml_catalog date="${now}">
  <shop>
    <name>${escapeXml(STORE_NAME)}</name>
    <company>${escapeXml(COMPANY_NAME)}</company>
    <url>${SITE_URL}</url>
    <currencies>
      <currency id="RUR" rate="1"/>
    </currencies>
    <categories>
${categoryXml}
    </categories>
    <delivery-options>
      <option cost="0" days="1-3" order-before="18"/>
    </delivery-options>
    <offers>
${offerXml}
    </offers>
  </shop>
</yml_catalog>`;

  writeFileSync(FEED_FILE, feed, "utf-8");
  console.log(`Yandex feed saved to ${FEED_FILE} (${products.length} products)`);

  db.close();
}

main();
