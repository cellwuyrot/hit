import { prisma } from "@/lib/prisma";

const SITE_URL = "https://tophitt.ru";
const STORE_NAME = "ТОПХИТ";
const COMPANY_NAME = "ИП Чибисов А.С.";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });
  const products = await prisma.product.findMany({
    where: { inStock: { gt: 0 } },
    include: { category: true },
  });

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

  return new Response(feed, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
