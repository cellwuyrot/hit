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

interface RowData {
  name?: string;
  price?: number | string;
  oldPrice?: number | string;
  description?: string;
  image?: string;
  inStock?: number | string;
  brand?: string;
  color?: string;
  productType?: string;
  category?: string;
  country?: string;
  barcode?: string;
  code?: string;
  weight?: number | string;
  volume?: number | string;
  packSize?: number | string;
}

const COL_MAP: Record<string, keyof RowData> = {
  "название": "name", "наименование": "name", "наименование товара": "name",
  "товар": "name", "name": "name", "product": "name",
  "цена": "price", "price": "price", "стоимость": "price",
  "старая цена": "oldPrice", "old price": "oldPrice", "oldprice": "oldPrice",
  "описание": "description", "description": "description",
  "изображение": "image", "картинка": "image", "фото": "image", "image": "image",
  "в наличии": "inStock", "остаток": "inStock", "количество": "inStock",
  "instock": "inStock", "stock": "inStock",
  "кол-во": "inStock", "кол-во (шт) в упаковке": "packSize",
  "бренд": "brand", "brand": "brand", "производитель": "brand",
  "цвет": "color", "color": "color",
  "тип": "productType", "type": "productType", "вид": "productType", "producttype": "productType",
  "дистр": "productType",
  "категория": "category", "category": "category",
  "страна произв.": "country", "страна": "country", "country": "country",
  "штрихкод": "barcode", "barcode": "barcode", "штрих-код": "barcode", "ean": "barcode",
  "код": "code", "code": "code", "артикул": "code", "sku": "code",
  "вес (кг)": "weight", "вес": "weight", "weight": "weight",
  "объем (м³)": "volume", "объём (м³)": "volume", "объем": "volume", "объём": "volume", "volume": "volume",
  "ваш заказ (упаковки)": "inStock", "ваш заказ": "inStock", "годен до": "description",
};

function normalizeRows(raw: Record<string, unknown>[]): RowData[] {
  return raw.map((row) => {
    const out: RowData = {};
    for (const [key, val] of Object.entries(row)) {
      const mapped = COL_MAP[key.toLowerCase().trim()];
      if (mapped) {
        (out as Record<string, unknown>)[mapped] = val;
      }
    }
    return out;
  });
}

function parseFile(buffer: Buffer, fileName: string): RowData[] {
  if (fileName.endsWith(".csv") || fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
    return normalizeRows(raw);
  }
  return [];
}

export async function POST(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const mode = formData.get("mode") as string | null;
  const selectedIndices = formData.get("selected") as string | null;

  if (!file) return Response.json({ error: "Файл не выбран" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = file.name.toLowerCase();

  if (!fileName.endsWith(".csv") && !fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
    return Response.json({ error: "Поддерживаемые форматы: CSV, XLSX, XLS" }, { status: 400 });
  }

  const rows = parseFile(buffer, fileName);

  if (rows.length === 0) {
    return Response.json({ error: "Файл пуст или не удалось распознать данные" }, { status: 400 });
  }

  // Preview mode — return parsed rows for selection
  if (mode === "preview") {
    const preview = rows.map((r, i) => ({
      index: i,
      name: String(r.name || ""),
      price: r.price ? Number(r.price) : 0,
      brand: String(r.brand || ""),
      category: String(r.category || ""),
      image: String(r.image || ""),
      inStock: r.inStock ? Number(r.inStock) : 0,
      country: String(r.country || ""),
      barcode: String(r.barcode || ""),
      code: String(r.code || ""),
      weight: r.weight ? Number(r.weight) : null,
      volume: r.volume ? Number(r.volume) : null,
      packSize: r.packSize ? Number(r.packSize) : null,
      description: String(r.description || ""),
    }));
    return Response.json({ preview, total: rows.length });
  }

  // Import mode — import selected rows
  let rowsToImport = rows;
  if (selectedIndices) {
    const indices = new Set(JSON.parse(selectedIndices) as number[]);
    rowsToImport = rows.filter((_, i) => indices.has(i));
  }

  const validRows = rowsToImport.filter((r) => r.name);
  if (validRows.length === 0) {
    return Response.json({ error: "Не найдено строк с названием товара" }, { status: 400 });
  }

  let imported = 0;
  let updated = 0;
  for (const row of validRows) {
    const price = Number(row.price) || 0;
    const oldPrice = row.oldPrice ? Number(row.oldPrice) : null;
    const inStock = row.inStock ? Number(row.inStock) : 0;
    const weight = row.weight ? Number(row.weight) : null;
    const volume = row.volume ? Number(row.volume) : null;
    const packSize = row.packSize ? Number(row.packSize) : null;
    const name = String(row.name);
    const brand = String(row.brand || "");

    let categoryId: string | undefined;
    if (row.category) {
      const cat = await prisma.category.findFirst({ where: { name: { equals: String(row.category) } } });
      if (cat) categoryId = cat.id;
    }
    if (!categoryId) {
      const first = await prisma.category.findFirst({ orderBy: { order: "asc" } });
      categoryId = first?.id;
    }
    if (!categoryId) continue;

    // Check if product already exists (by name + brand)
    const existing = await prisma.product.findFirst({
      where: { name, brand },
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { inStock: existing.inStock + inStock },
      });
      updated++;
    } else {
      const slug = slugify(name) + "-" + Date.now() + "-" + imported;
      await prisma.product.create({
        data: {
          name,
          slug,
          price,
          oldPrice,
          description: String(row.description || ""),
          image: String(row.image || ""),
          inStock,
          brand,
          color: String(row.color || ""),
          productType: String(row.productType || ""),
          country: String(row.country || ""),
          barcode: String(row.barcode || ""),
          code: String(row.code || ""),
          weight,
          volume,
          packSize,
          categoryId,
        },
      });
      imported++;
    }
  }

  return Response.json({ imported, updated, total: rowsToImport.length, skipped: rowsToImport.length - imported - updated });
}
