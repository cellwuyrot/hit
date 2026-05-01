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
}

const COL_MAP: Record<string, keyof RowData> = {
  "название": "name", "наименование": "name", "товар": "name", "name": "name", "product": "name",
  "цена": "price", "price": "price", "стоимость": "price",
  "старая цена": "oldPrice", "old price": "oldPrice", "oldprice": "oldPrice",
  "описание": "description", "description": "description",
  "изображение": "image", "картинка": "image", "фото": "image", "image": "image",
  "в наличии": "inStock", "остаток": "inStock", "кол-во": "inStock", "количество": "inStock", "instock": "inStock", "stock": "inStock",
  "бренд": "brand", "brand": "brand", "производитель": "brand",
  "цвет": "color", "color": "color",
  "тип": "productType", "type": "productType", "вид": "productType", "producttype": "productType",
  "категория": "category", "category": "category",
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

export async function POST(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return Response.json({ error: "Файл не выбран" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = file.name.toLowerCase();

  let rows: RowData[] = [];

  if (fileName.endsWith(".csv") || fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
    rows = normalizeRows(raw);
  } else {
    return Response.json({ error: "Поддерживаемые форматы: CSV, XLSX, XLS" }, { status: 400 });
  }

  const validRows = rows.filter((r) => r.name && r.price);
  if (validRows.length === 0) {
    return Response.json({ error: "Не найдено строк с обязательными полями (название, цена). Проверьте заголовки столбцов." }, { status: 400 });
  }

  let imported = 0;
  for (const row of validRows) {
    const price = Number(row.price) || 0;
    const oldPrice = row.oldPrice ? Number(row.oldPrice) : null;
    const inStock = row.inStock ? Number(row.inStock) : 0;

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

    const slug = slugify(String(row.name)) + "-" + Date.now() + "-" + imported;
    await prisma.product.create({
      data: {
        name: String(row.name),
        slug,
        price,
        oldPrice,
        description: String(row.description || ""),
        image: String(row.image || ""),
        inStock,
        brand: String(row.brand || ""),
        color: String(row.color || ""),
        productType: String(row.productType || ""),
        categoryId,
      },
    });
    imported++;
  }

  return Response.json({ imported, total: rows.length, skipped: rows.length - imported });
}
