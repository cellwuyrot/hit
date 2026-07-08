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

// Only three fields matter for review import: which product, the review text and the buyer name.
// An optional rating column is supported too. The review date is intentionally never imported.
const AUTO_DETECT: Record<string, string[]> = {
  product: ["товар", "продукт", "наименование", "название", "название товара", "product", "item", "sku", "артикул", "код"],
  text: ["отзыв", "текст", "текст отзыва", "комментарий", "review", "text", "comment", "feedback"],
  author: ["имя", "имя покупателя", "покупатель", "автор", "клиент", "name", "author", "customer"],
  rating: ["оценка", "рейтинг", "звёзды", "звезды", "rating", "stars", "score"],
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
    if (nonEmpty.length < 2) continue;
    const lower = nonEmpty.map((c) => String(c).toLowerCase().trim());
    const known = lower.filter((l) => Object.values(AUTO_DETECT).some((aliases) => aliases.includes(l)));
    const score = nonEmpty.filter((c) => typeof c === "string" && isNaN(Number(c))).length + known.length * 5;
    if (score > bestScore) {
      bestScore = score;
      bestRow = i;
    }
  }
  return bestRow;
}

export const maxDuration = 60;

// PUT — parse an uploaded spreadsheet and return its headers + rows for column mapping.
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

  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith(".csv") && !fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
    return Response.json({ error: "Поддерживаемые форматы: CSV, XLSX, XLS" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  // CSV files are decoded as UTF-8 explicitly — otherwise the xlsx parser misreads
  // Cyrillic text (товар/отзыв/имя) as Latin1. XLSX/XLS store text as UTF-8 already.
  const workbook = fileName.endsWith(".csv")
    ? XLSX.read(new TextDecoder("utf-8").decode(buffer), { type: "string" })
    : XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

  if (aoa.length < 2) {
    return Response.json({ error: "Файл пуст или содержит слишком мало данных" }, { status: 400 });
  }

  const headerRowIdx = findHeaderRow(aoa);
  const headerRow = aoa[headerRowIdx];
  const colIndices: number[] = [];
  const headers: string[] = [];
  for (let j = 0; j < headerRow.length; j++) {
    const val = headerRow[j];
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      colIndices.push(j);
      headers.push(String(val).trim());
    }
  }

  if (headers.length < 2) {
    return Response.json({ error: "Не удалось определить заголовки колонок" }, { status: 400 });
  }

  const rows: Record<string, string>[] = [];
  for (let i = headerRowIdx + 1; i < aoa.length; i++) {
    const row = aoa[i];
    if (!row) continue;
    const nonEmpty = row.filter((c) => c !== undefined && c !== null && String(c).trim() !== "");
    if (nonEmpty.length === 0) continue;
    const obj: Record<string, string> = {};
    for (let k = 0; k < headers.length; k++) {
      const val = row[colIndices[k]];
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

interface ImportReview {
  product?: string;
  text?: string;
  author?: string;
  rating?: number | string;
}

// POST — create reviews from mapped rows, matching each row to a product by name/code/slug.
export async function POST(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const body = await request.json();
  const reviews: ImportReview[] = body.reviews;
  if (!reviews || reviews.length === 0) {
    return Response.json({ error: "Нет отзывов для импорта" }, { status: 400 });
  }

  const allProducts = await prisma.product.findMany({
    select: { id: true, name: true, slug: true, code: true, barcode: true },
  });
  const byName = new Map<string, string>();
  const byCode = new Map<string, string>();
  const bySlug = new Map<string, string>();
  for (const p of allProducts) {
    byName.set(p.name.toLowerCase().trim(), p.id);
    bySlug.set(p.slug.toLowerCase().trim(), p.id);
    if (p.code) byCode.set(p.code.toLowerCase().trim(), p.id);
    if (p.barcode) byCode.set(p.barcode.toLowerCase().trim(), p.id);
  }

  const matchProduct = (raw: string): string | undefined => {
    const key = raw.toLowerCase().trim();
    return byName.get(key) || byCode.get(key) || bySlug.get(key) || bySlug.get(slugify(raw));
  };

  const toCreate: { productId: string; authorName: string; text: string; rating: number }[] = [];
  const notFound: string[] = [];

  for (const row of reviews) {
    const productRaw = row.product ? String(row.product).trim() : "";
    const text = row.text ? String(row.text).trim() : "";
    if (!productRaw || !text) continue;

    const productId = matchProduct(productRaw);
    if (!productId) {
      if (!notFound.includes(productRaw)) notFound.push(productRaw);
      continue;
    }

    const rating = Math.min(5, Math.max(1, Number(row.rating) || 5));
    toCreate.push({
      productId,
      authorName: row.author ? String(row.author).trim() : "",
      text,
      rating,
    });
  }

  let imported = 0;
  for (const r of toCreate) {
    // userId is left unset (NULL) — these are admin-imported reviews with no linked account.
    // No createdAt is passed on purpose — the review date is left to the database default.
    await prisma.review.create({
      data: { productId: r.productId, authorName: r.authorName, text: r.text, rating: r.rating, published: true },
    });
    imported++;
  }

  return Response.json({
    imported,
    total: reviews.length,
    notFound: notFound.slice(0, 50),
    notFoundCount: notFound.length,
  });
}
