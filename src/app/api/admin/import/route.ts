import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import * as XLSX from "xlsx";

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

const AUTO_DETECT: Record<string, string[]> = {
  name: ["название", "наименование", "наименование товара", "товар", "name", "product"],
  category: ["категория", "category"],
  brand: ["бренд", "brand", "производитель"],
  country: ["страна произв.", "страна", "country"],
  price: ["цена", "price", "стоимость"],
  weight: ["вес (кг)", "вес", "weight"],
  inStock: ["в наличии", "остаток", "количество", "instock", "stock", "кол-во", "ваш заказ (упаковки)", "ваш заказ"],
  barcode: ["штрихкод", "barcode", "штрих-код", "ean"],
  code: ["код", "code", "артикул", "sku"],
  image: ["изображение", "картинка", "фото", "image"],
  volume: ["объем (м³)", "объём (м³)", "объем", "объём", "volume"],
  packSize: ["кол-во (шт) в упаковке"],
  description: ["описание", "description"],
  oldPrice: ["старая цена", "old price", "oldprice"],
  color: ["цвет", "color"],
  productType: ["тип", "type", "вид", "producttype", "дистр"],
};

function autoDetectMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const header of headers) {
    const lower = header.toLowerCase().trim();
    for (const [field, aliases] of Object.entries(AUTO_DETECT)) {
      if (aliases.includes(lower) && !Object.values(mapping).includes(field)) {
        mapping[header] = field;
        break;
      }
    }
  }
  return mapping;
}

// POST with file → parse mode (upload once, get all data back)
export async function POST(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) return Response.json({ error: "Файл не выбран" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = file.name.toLowerCase();

  if (!fileName.endsWith(".csv") && !fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
    return Response.json({ error: "Поддерживаемые форматы: CSV, XLSX, XLS" }, { status: 400 });
  }

  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  if (rawRows.length === 0) {
    return Response.json({ error: "Файл пуст или не удалось распознать данные" }, { status: 400 });
  }

  const headerSet = new Set<string>();
  for (const row of rawRows) {
    for (const key of Object.keys(row)) {
      headerSet.add(key);
    }
  }
  const headers = Array.from(headerSet);
  const autoMap = autoDetectMapping(headers);

  // Convert all values to strings for safe JSON transfer
  const rows = rawRows.map((row) => {
    const obj: Record<string, string> = {};
    for (const h of headers) {
      obj[h] = row[h] !== undefined && row[h] !== null ? String(row[h]) : "";
    }
    return obj;
  });

  const sample = rows.slice(0, 3);

  return Response.json({ headers, autoMap, sample, rows, totalRows: rows.length });
}

// PUT → import mode (receive mapped data as JSON, no file re-upload)
interface ImportProduct {
  name?: string;
  price?: number;
  brand?: string;
  category?: string;
  image?: string;
  inStock?: number;
  country?: string;
  barcode?: string;
  code?: string;
  weight?: number | null;
  volume?: number | null;
  packSize?: number | null;
  description?: string;
  oldPrice?: number | null;
  color?: string;
  productType?: string;
}

export async function PUT(request: Request) {
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
    const brand = row.brand || "";
    const price = Number(row.price) || 0;
    const oldPrice = row.oldPrice != null ? Number(row.oldPrice) : null;
    const inStock = Number(row.inStock) || 0;
    const weight = row.weight != null ? Number(row.weight) : null;
    const volume = row.volume != null ? Number(row.volume) : null;
    const packSize = row.packSize != null ? Number(row.packSize) : null;

    const categoryId = (row.category ? catByName.get(row.category.toLowerCase()) : undefined) || defaultCatId;

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
          description: row.description || "",
          image: row.image || "",
          inStock,
          brand,
          color: row.color || "",
          productType: row.productType || "",
          country: row.country || "",
          barcode: row.barcode || "",
          code: row.code || "",
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
