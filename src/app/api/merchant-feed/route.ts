import { prisma } from "@/lib/prisma";

const SITE_URL = "https://tophitt.ru";
const STORE_NAME = "ТОПХИТ";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const products = await prisma.product.findMany({
    where: { inStock: { gt: 0 } },
    include: { category: true },
  });

  const items = products.map((p) => {
    const availability = p.inStock > 0 ? "in_stock" : "out_of_stock";
    const price = `${p.price.toFixed(2)} RUB`;
    const salePrice = p.oldPrice && p.oldPrice > p.price ? `${p.price.toFixed(2)} RUB` : "";
    const regularPrice = p.oldPrice && p.oldPrice > p.price ? `${p.oldPrice.toFixed(2)} RUB` : "";
    const imageUrl = p.image.startsWith("http") ? p.image : `${SITE_URL}${p.image}`;
    const productUrl = `${SITE_URL}/product/${p.slug}`;
    const brand = p.brand || STORE_NAME;
    const description = p.description || p.name;

    let itemXml = `    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      <title>${escapeXml(p.name)}</title>
      <description>${escapeXml(description)}</description>
      <link>${escapeXml(productUrl)}</link>
      <g:image_link>${escapeXml(imageUrl)}</g:image_link>`;

    const additionalImages = [p.image2, p.image3, p.image4].filter(Boolean);
    for (const img of additionalImages) {
      const imgUrl = img.startsWith("http") ? img : `${SITE_URL}${img}`;
      itemXml += `\n      <g:additional_image_link>${escapeXml(imgUrl)}</g:additional_image_link>`;
    }

    itemXml += `
      <g:availability>${availability}</g:availability>
      <g:price>${regularPrice || price}</g:price>`;

    if (salePrice) {
      itemXml += `\n      <g:sale_price>${salePrice}</g:sale_price>`;
    }

    itemXml += `
      <g:brand>${escapeXml(brand)}</g:brand>
      <g:condition>new</g:condition>
      <g:product_type>${escapeXml(p.category?.name || "")}</g:product_type>`;

    if (p.barcode) {
      itemXml += `\n      <g:gtin>${escapeXml(p.barcode)}</g:gtin>`;
    } else {
      itemXml += `\n      <g:identifier_exists>false</g:identifier_exists>`;
    }

    if (p.weight) {
      itemXml += `\n      <g:shipping_weight>${p.weight} kg</g:shipping_weight>`;
    }

    if (p.color) {
      itemXml += `\n      <g:color>${escapeXml(p.color)}</g:color>`;
    }

    if (p.country) {
      itemXml += `\n      <g:country_of_origin>${escapeXml(p.country)}</g:country_of_origin>`;
    }

    itemXml += `\n    </item>`;
    return itemXml;
  });

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(STORE_NAME)}</title>
    <link>${SITE_URL}</link>
    <description>Товары интернет-магазина ${escapeXml(STORE_NAME)}</description>
${items.join("\n")}
  </channel>
</rss>`;

  return new Response(feed, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
