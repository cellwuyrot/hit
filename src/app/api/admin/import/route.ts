import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

function checkAdmin(request: Request): boolean {
  const token = getTokenFromRequest(request);
  if (!token) return false;
  const payload = verifyToken(token);
  return !!payload && payload.role === "admin";
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[а-яё]/g, (ch) => {
      const map: Record<string, string> = {
        а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
        з: "z", и: "i", й: "j", к: "k", л: "l", м: "m", н: "n", о: "o",
        п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c",
        ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
      };
      return map[ch] || ch;
    })
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface ImportProduct {
  name?: string;
  price?: number | string;
  brand?: string;
  category?: string;
  image?: string;
  inStock?: number | string;
  country?: string;
  barcode?: string;
  code?: string;
  weight?: number | string | null;
  volume?: number | string | null;
  packSize?: number | string | null;
  description?: string;
  oldPrice?: number | string | null;
  color?: string;
  productType?: string;
}

// POST — import products (receive mapped data as JSON)
export async function POST(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const body = await request.json();
  const products: ImportProduct[] = body.products;

  if (!products || products.length === 0) {
    return Response.json({ error: "Нет товаров для импорта" }, { status: 400 });
  }

  const validRows = products.filter((r) => r.name);
  if (validRows.length === 0) {
    return Response.json({ error: "Не найдено строк с названием товара" }, { status: 400 });
  }

  // Pre-fetch all categories for batch lookup
  const allCategories = await prisma.category.findMany({ orderBy: { order: "asc" } });
  const catByName = new Map(allCategories.map((c) => [c.name.toLowerCase(), c.id]));
  const defaultCatId = allCategories[0]?.id;

  if (!defaultCatId) {
    return Response.json({ error: "Нет категорий в базе данных" }, { status: 400 });
  }

  // Pre-fetch existing products for duplicate detection
  const names = validRows.map((r) => String(r.name));
  const existingProducts = await prisma.product.findMany({
    where: { name: { in: names } },
    select: { id: true, name: true, brand: true, inStock: true },
  });
  const existingMap = new Map<string, { id: string; inStock: number }>();
  for (const p of existingProducts) {
    existingMap.set(`${p.name}|||${p.brand}`, { id: p.id, inStock: p.inStock });
  }

  let imported = 0;
  let updated = 0;

  for (const row of validRows) {
    const name = String(row.name);
    const brand = row.brand ? String(row.brand) : "";
    const price = Number(row.price) || 0;
    const oldPrice = row.oldPrice != null && row.oldPrice !== "" ? Number(row.oldPrice) : null;
    const inStock = Number(row.inStock) || 0;
    const weight = row.weight != null && row.weight !== "" ? Number(row.weight) : null;
    const volume = row.volume != null && row.volume !== "" ? Number(row.volume) : null;
    const packSize = row.packSize != null && row.packSize !== "" ? Number(row.packSize) : null;

    const categoryId = (row.category ? catByName.get(String(row.category).toLowerCase()) : undefined) || defaultCatId;

    const key = `${name}|||${brand}`;
    const existing = existingMap.get(key);

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { inStock: existing.inStock + inStock },
      });
      existing.inStock += inStock;
      updated++;
    } else {
      const slug = slugify(name) + "-" + Date.now() + "-" + imported;
      const created = await prisma.product.create({
        data: {
          name,
          slug,
          price,
          oldPrice,
          description: row.description ? String(row.description) : "",
          image: row.image ? String(row.image) : "",
          inStock,
          brand,
          color: row.color ? String(row.color) : "",
          productType: row.productType ? String(row.productType) : "",
          country: row.country ? String(row.country) : "",
          barcode: row.barcode ? String(row.barcode) : "",
          code: row.code ? String(row.code) : "",
          weight,
          volume,
          packSize,
          categoryId,
        },
      });
      existingMap.set(key, { id: created.id, inStock });
      imported++;
    }
  }

  return Response.json({ imported, updated, total: products.length, skipped: products.length - imported - updated });
}
