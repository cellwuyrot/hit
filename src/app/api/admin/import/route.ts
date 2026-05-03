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

// Auto-detection hints for column mapping
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

function parseRawRows(buffer: Buffer, fileName: string): Record<string, unknown>[] {
  if (fileName.endsWith(".csv") || fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  }
  return [];
}

function getHeaders(raw: Record<string, unknown>[]): string[] {
  if (raw.length === 0) return [];
  const headerSet = new Set<string>();
  for (const row of raw) {
    for (const key of Object.keys(row)) {
      headerSet.add(key);
    }
  }
  return Array.from(headerSet);
}

interface MappedRow {
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

function applyMapping(raw: Record<string, unknown>[], columnMap: Record<string, string>): MappedRow[] {
  return raw.map((row) => {
    const out: Record<string, unknown> = {};
    for (const [sourceCol, targetField] of Object.entries(columnMap)) {
      if (targetField && targetField !== "" && row[sourceCol] !== undefined) {
        out[targetField] = row[sourceCol];
      }
    }
    return {
      name: out.name ? String(out.name) : undefined,
      price: out.price ? Number(out.price) : 0,
      brand: out.brand ? String(out.brand) : "",
      category: out.category ? String(out.category) : "",
      image: out.image ? String(out.image) : "",
      inStock: out.inStock ? Number(out.inStock) : 0,
      country: out.country ? String(out.country) : "",
      barcode: out.barcode ? String(out.barcode) : "",
      code: out.code ? String(out.code) : "",
      weight: out.weight ? Number(out.weight) : null,
      volume: out.volume ? Number(out.volume) : null,
      packSize: out.packSize ? Number(out.packSize) : null,
      description: out.description ? String(out.description) : "",
      oldPrice: out.oldPrice ? Number(out.oldPrice) : null,
      color: out.color ? String(out.color) : "",
      productType: out.productType ? String(out.productType) : "",
    };
  });
}

export async function POST(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const mode = formData.get("mode") as string | null;
  const selectedIndices = formData.get("selected") as string | null;
  const columnMapStr = formData.get("columnMap") as string | null;

  if (!file) return Response.json({ error: "Файл не выбран" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = file.name.toLowerCase();

  if (!fileName.endsWith(".csv") && !fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
    return Response.json({ error: "Поддерживаемые форматы: CSV, XLSX, XLS" }, { status: 400 });
  }

  const rawRows = parseRawRows(buffer, fileName);

  if (rawRows.length === 0) {
    return Response.json({ error: "Файл пуст или не удалось распознать данные" }, { status: 400 });
  }

  // Headers mode — return column names + auto-detected mapping + sample data
  if (mode === "headers") {
    const headers = getHeaders(rawRows);
    const autoMap = autoDetectMapping(headers);
    const sample = rawRows.slice(0, 3).map((row) => {
      const obj: Record<string, string> = {};
      for (const h of headers) {
        obj[h] = row[h] !== undefined ? String(row[h]) : "";
      }
      return obj;
    });
    return Response.json({ headers, autoMap, sample, totalRows: rawRows.length });
  }

  // Parse column mapping from request
  const columnMap: Record<string, string> = columnMapStr ? JSON.parse(columnMapStr) : {};

  // If no mapping provided, try auto-detection
  if (Object.keys(columnMap).length === 0) {
    const headers = getHeaders(rawRows);
    const autoMap = autoDetectMapping(headers);
    Object.assign(columnMap, autoMap);
  }

  const rows = applyMapping(rawRows, columnMap);

  // Preview mode — return mapped rows for selection
  if (mode === "preview") {
    const preview = rows.map((r, i) => ({
      index: i,
      name: r.name || "",
      price: r.price || 0,
      brand: r.brand || "",
      category: r.category || "",
      inStock: r.inStock || 0,
      country: r.country || "",
      weight: r.weight,
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
    const name = String(row.name);
    const brand = row.brand || "";
    const price = row.price || 0;
    const oldPrice = row.oldPrice ?? null;
    const inStock = row.inStock || 0;
    const weight = row.weight ?? null;
    const volume = row.volume ?? null;
    const packSize = row.packSize ?? null;

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
      imported++;
    }
  }

  return Response.json({ imported, updated, total: rowsToImport.length, skipped: rowsToImport.length - imported - updated });
}
