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

  // UTF-8 CSV is common; fall back to Windows-1251 for older Russian exports.
  let codepage: number | undefined;
  if (fileName.endsWith(".csv")) {
    try { new TextDecoder("utf-8", { fatal: true }).decode(buffer); codepage = 65001; }
    catch { codepage = 1251; }
  }
  const workbook = XLSX.read(buffer, { type: "buffer", ...(codepage ? { codepage } : {}) });
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

  const minCells = 1;

  const nameColIdx = colIndices[headers.findIndex((h) => {
    const l = h.toLowerCase();
    return AUTO_DETECT.name.includes(l);
  })] ?? -1;


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

// POST — атомарный импорт. Неизвестные категории разрешаются только вручную.
export async function POST(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });
  try {
    const body = await request.json();
    if (!Array.isArray(body.products) || body.products.length === 0 || body.products.length > 2000)
      return Response.json({ error: "Выберите от 1 до 2000 строк" }, { status: 400 });
    const rows = body.products as (ImportProduct & { categoryId?: string })[];
    const result = await prisma.$transaction(async tx => {
      const categories = await tx.category.findMany();
      const all = await tx.product.findMany({ select: { id: true, name: true, brand: true, code: true, barcode: true } });
      let imported = 0, updated = 0;
      const seen = new Set<string>();
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const fail = (message: string): never => { throw new Error(`Строка ${i + 1}: ${message}`); };
        const name = typeof r.name === "string" ? r.name.trim() : "";
        if (!name) fail("укажите название");
        const code = String(r.code || "").trim(), barcode = String(r.barcode || "").trim(), brand = String(r.brand || "").trim();
        const matches = all.filter(p => (code && p.code === code) || (barcode && p.barcode === barcode) || (p.name === name && p.brand === brand));
        const ids = [...new Set(matches.map(p => p.id))];
        if (ids.length > 1) fail("неоднозначное совпадение по артикулу, штрихкоду или названию: исправьте файл");
        const existing = ids[0] ? all.find(p => p.id === ids[0]) : undefined;
        if (existing && seen.has(existing.id)) fail("товар повторяется в файле");
        if (existing) seen.add(existing.id);
        let categoryId: string | undefined;
        if (r.categoryId) {
          categoryId = categories.find(c => c.id === r.categoryId)?.id;
          if (!categoryId) fail("выбранная категория не существует");
        } else if (r.category) {
          const cats = categories.filter(c => c.name.toLocaleLowerCase("ru") === String(r.category).trim().toLocaleLowerCase("ru"));
          if (cats.length !== 1) fail(`категория «${r.category}» не найдена или неоднозначна — выберите её вручную`);
          categoryId = cats[0].id;
        }
        if (!existing && !categoryId) fail("для нового товара выберите существующую категорию");
        function numberField(value: unknown, label: string, integer = false): number | undefined {
          if (value === undefined || value === null || value === "") return undefined;
          const n = Number(value);
          if (!Number.isFinite(n) || n < 0 || (integer && !Number.isInteger(n))) return fail(`некорректное значение «${label}»`);
          return n;
        }
        const price = numberField(r.price, "цена"), stock = numberField(r.inStock, "остаток", true);
        const oldPrice = numberField(r.oldPrice, "старая цена"), weight = numberField(r.weight, "вес"), volume = numberField(r.volume, "объём"), packSize = numberField(r.packSize, "упаковка", true);
        if (!existing && (price === undefined || price <= 0)) fail("для нового товара укажите положительную цену");
        const patch = {
          ...(price !== undefined ? { price } : {}), ...(stock !== undefined ? { inStock: stock } : {}),
          ...(oldPrice !== undefined ? { oldPrice } : {}), ...(weight !== undefined ? { weight } : {}),
          ...(volume !== undefined ? { volume } : {}), ...(packSize !== undefined ? { packSize } : {}),
          ...(categoryId ? { categoryId } : {}), ...(brand ? { brand } : {}), ...(code ? { code } : {}), ...(barcode ? { barcode } : {}),
          ...(r.country ? { country: String(r.country) } : {}), ...(r.color ? { color: String(r.color) } : {}),
          ...(r.productType ? { productType: String(r.productType) } : {}), ...(r.description ? { description: String(r.description) } : {}),
          ...(r.tags ? { tags: String(r.tags) } : {}), ...(r.image ? { image: String(r.image) } : {}),
          ...(r.expirationDate ? { expirationDate: String(r.expirationDate) } : {}),
        };
        if (existing) {
          await tx.product.update({ where: { id: existing.id }, data: patch });
          Object.assign(existing, { brand: brand || existing.brand, code: code || existing.code, barcode: barcode || existing.barcode });
          updated++;
        } else {
          const base = slugify(name); let slug = base, n = 2;
          while (await tx.product.findUnique({ where: { slug } })) slug = `${base}-${n++}`;
          const product = await tx.product.create({ data: { ...patch, name, slug, categoryId: categoryId!, price: price! } });
          all.push({ id: product.id, name: product.name, brand: product.brand, code: product.code, barcode: product.barcode });
          seen.add(product.id); imported++;
        }
      }
      return { imported, updated, total: rows.length, skipped: 0 };
    }, { timeout: 60000 });
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка импорта";
    console.error("Import failed", err);
    return Response.json({ error: message.startsWith("Строка ") ? message : "Импорт отменён. Проверьте файл и повторите попытку." }, { status: 400 });
  }
}
