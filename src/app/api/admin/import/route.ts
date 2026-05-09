import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { slugify } from "@/lib/slugify";
import * as XLSX from "xlsx";

function checkAdmin(request: Request): boolean {
  const token = getTokenFromRequest(request);
  if (!token) return false;
  const payload = verifyToken(token);
  return !!payload && payload.role === "admin";
}

const AUTO_DETECT: Record<string, string[]> = {
  name: ["название", "наименование", "наименование товара", "товар", "name", "product"],
  category: ["категория", "category"],
  brand: ["бренд", "brand", "производитель"],
  country: ["страна произв.", "страна", "country"],
  price: ["цена", "price", "стоимость", "дистр"],
  weight: ["вес (кг)", "вес", "weight"],
  inStock: ["в наличии", "остаток", "количество", "instock", "stock", "кол-во", "наличие", "количество шт"],
  barcode: ["штрихкод", "barcode", "штрих-код", "ean"],
  code: ["код", "code", "артикул", "sku"],
  image: ["изображение", "картинка", "фото", "image"],
  volume: ["объем (м³)", "объём (м³)", "объем", "объём", "volume"],
  packSize: ["кол-во (шт) в упаковке", "в упаковке", "упаковка"],
  expirationDate: ["годен до", "срок годности", "expiration", "годность"],
  description: ["описание", "description"],
  oldPrice: ["старая цена", "old price", "oldprice"],
  color: ["цвет", "color"],
  productType: ["тип", "type", "вид", "producttype"],
  tags: ["теги", "ключевые слова", "tags", "keywords", "мета-теги"],
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

function findHeaderRow(aoa: unknown[][]): number {
  let bestRow = 0;
  let bestScore = 0;

  for (let i = 0; i < Math.min(20, aoa.length); i++) {
    const row = aoa[i];
    if (!row) continue;
    const nonEmpty = row.filter((c) => c !== undefined && c !== null && String(c).trim() !== "");
    if (nonEmpty.length < 3) continue;

    const textCells = nonEmpty.filter((c) => typeof c === "string" && isNaN(Number(c)));
    const score = textCells.length;

    const lower = nonEmpty.map((c) => String(c).toLowerCase().trim());
    const knownHeaders = lower.filter((l) =>
      Object.values(AUTO_DETECT).some((aliases) => aliases.includes(l))
    );
    const finalScore = score + knownHeaders.length * 5;

    if (finalScore > bestScore) {
      bestScore = finalScore;
      bestRow = i;
    }
  }
  return bestRow;
}

function isDataRow(row: unknown[], minCells: number): boolean {
  if (!row) return false;
  const nonEmpty = row.filter((c) => c !== undefined && c !== null && String(c).trim() !== "");
  return nonEmpty.length >= minCells;
}

export const maxDuration = 60;

// PUT — parse file and return structured data (upload file once)
export async function PUT(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Файл слишком большой. Максимум ~10 МБ." }, { status: 413 });
  }
  const file = formData.get("file") as File | null;

  if (!file) return Response.json({ error: "Файл не выбран" }, { status: 400 });

  if (file.size > 10 * 1024 * 1024) {
    return Response.json({ error: "Файл слишком большой. Максимум 10 МБ." }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = file.name.toLowerCase();

  if (!fileName.endsWith(".csv") && !fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
    return Response.json({ error: "Поддерживаемые форматы: CSV, XLSX, XLS" }, { status: 400 });
  }

  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

  if (aoa.length < 2) {
    return Response.json({ error: "Файл пуст или содержит слишком мало данных" }, { status: 400 });
  }

  const headerRowIdx = findHeaderRow(aoa);
  const headerRow = aoa[headerRowIdx];
  const headers: string[] = headerRow
    .map((c) => (c !== undefined && c !== null ? String(c).trim() : ""))
    .filter((h) => h !== "");

  if (headers.length < 2) {
    return Response.json({ error: "Не удалось определить заголовки колонок" }, { status: 400 });
  }

  const colIndices: number[] = [];
  for (let j = 0; j < headerRow.length; j++) {
    const val = headerRow[j];
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      colIndices.push(j);
    }
  }

  const minCells = Math.max(3, Math.floor(headers.length * 0.3));

  const nameColIdx = colIndices[headers.findIndex((h) => {
    const l = h.toLowerCase();
    return AUTO_DETECT.name.includes(l);
  })] ?? -1;

  const catColIdx = colIndices[headers.findIndex((h) => AUTO_DETECT.category.includes(h.toLowerCase()))] ?? -1;
  const brandColIdx = colIndices[headers.findIndex((h) => AUTO_DETECT.brand.includes(h.toLowerCase()))] ?? -1;

  const rows: Record<string, string>[] = [];
  for (let i = headerRowIdx + 1; i < aoa.length; i++) {
    const row = aoa[i];
    if (!row) continue;

    if (!isDataRow(row, minCells)) continue;

    const firstCell = row[colIndices[0]];
    if (firstCell !== undefined && String(firstCell).trim() === headers[0]) continue;

    if (nameColIdx >= 0) {
      const nameVal = row[nameColIdx];
      if (!nameVal || String(nameVal).trim() === "") continue;
      const nameStr = String(nameVal).trim();
      if (nameStr === "ИТОГО УПАКОВОК:" || nameStr.startsWith("ИТОГО")) continue;
    }

    const hasCat = catColIdx >= 0 && row[catColIdx] && String(row[catColIdx]).trim() !== "";
    const hasBrand = brandColIdx >= 0 && row[brandColIdx] && String(row[brandColIdx]).trim() !== "";
    if (!hasCat && !hasBrand && nameColIdx >= 0) continue;

    const obj: Record<string, string> = {};
    for (let k = 0; k < headers.length; k++) {
      const colIdx = colIndices[k];
      const val = row[colIdx];
      obj[headers[k]] = val !== undefined && val !== null ? String(val) : "";
    }
    rows.push(obj);
  }

  if (rows.length === 0) {
    return Response.json({ error: "Не найдено строк с данными" }, { status: 400 });
  }

  const autoMap = autoDetectMapping(headers);
  const sample = rows.slice(0, 3);

  return Response.json({ headers, autoMap, sample, rows, totalRows: rows.length });
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
  expirationDate?: string;
  tags?: string;
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

  const allCategories = await prisma.category.findMany({ orderBy: { order: "asc" } });
  const catByName = new Map(allCategories.map((c) => [c.name.toLowerCase(), c.id]));
  const defaultCatId = allCategories[0]?.id;

  if (!defaultCatId) {
    return Response.json({ error: "Нет категорий в базе данных" }, { status: 400 });
  }

  const names = validRows.map((r) => String(r.name));
  const codes = validRows.filter((r) => r.code).map((r) => String(r.code));
  const barcodes = validRows.filter((r) => r.barcode).map((r) => String(r.barcode));

  const existingProducts = await prisma.product.findMany({
    where: {
      OR: [
        { name: { in: names } },
        ...(codes.length > 0 ? [{ code: { in: codes } }] : []),
        ...(barcodes.length > 0 ? [{ barcode: { in: barcodes } }] : []),
      ],
    },
    select: { id: true, name: true, brand: true, inStock: true, code: true, barcode: true },
  });

  const existingByName = new Map<string, { id: string; inStock: number }>();
  const existingByCode = new Map<string, { id: string; inStock: number }>();
  const existingByBarcode = new Map<string, { id: string; inStock: number }>();
  for (const p of existingProducts) {
    existingByName.set(`${p.name}|||${p.brand}`, { id: p.id, inStock: p.inStock });
    if (p.code) existingByCode.set(p.code, { id: p.id, inStock: p.inStock });
    if (p.barcode) existingByBarcode.set(p.barcode, { id: p.id, inStock: p.inStock });
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

    const codeStr = row.code ? String(row.code) : "";
    const barcodeStr = row.barcode ? String(row.barcode) : "";
    const existing = (codeStr && existingByCode.get(codeStr))
      || (barcodeStr && existingByBarcode.get(barcodeStr))
      || existingByName.get(`${name}|||${brand}`);

    if (existing) {
      const updateData: Record<string, unknown> = { inStock };
      if (price > 0) updateData.price = price;
      if (oldPrice !== null) updateData.oldPrice = oldPrice;
      if (brand) updateData.brand = brand;
      if (row.country) updateData.country = String(row.country);
      if (weight !== null) updateData.weight = weight;
      if (volume !== null) updateData.volume = volume;
      if (packSize !== null) updateData.packSize = packSize;
      if (codeStr) updateData.code = codeStr;
      if (barcodeStr) updateData.barcode = barcodeStr;
      if (row.color) updateData.color = String(row.color);
      if (row.description) updateData.description = String(row.description);
      if (row.tags) updateData.tags = String(row.tags);
      if (row.image) updateData.image = String(row.image);
      if (row.expirationDate) updateData.expirationDate = String(row.expirationDate);

      await prisma.product.update({
        where: { id: existing.id },
        data: updateData,
      });
      updated++;
    } else {
      let slug = slugify(name);
      const slugExists = await prisma.product.findFirst({ where: { slug } });
      if (slugExists) {
        slug = slug + "-" + Math.random().toString(36).slice(2, 6);
      }
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
          barcode: barcodeStr,
          code: codeStr,
          weight,
          volume,
          packSize,
          expirationDate: row.expirationDate ? String(row.expirationDate) : "",
          tags: row.tags ? String(row.tags) : "",
          categoryId,
        },
      });
      existingByName.set(`${name}|||${brand}`, { id: created.id, inStock });
      if (codeStr) existingByCode.set(codeStr, { id: created.id, inStock });
      if (barcodeStr) existingByBarcode.set(barcodeStr, { id: created.id, inStock });
      imported++;
    }
  }

  return Response.json({ imported, updated, total: products.length, skipped: products.length - imported - updated });
}
