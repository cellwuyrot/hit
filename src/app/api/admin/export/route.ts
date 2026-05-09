import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import * as XLSX from "xlsx";

function checkAdmin(request: Request): boolean {
  const token = getTokenFromRequest(request);
  if (!token) return false;
  const payload = verifyToken(token);
  return !!payload && payload.role === "admin";
}

export async function POST(request: Request) {
  if (!checkAdmin(request)) {
    return Response.json({ error: "Нет доступа" }, { status: 401 });
  }

  const body = await request.json();
  const ids: string[] | undefined = body.ids;
  const filter: string | undefined = body.filter;

  let whereClause = {};
  if (filter === "no-tags") {
    whereClause = { OR: [{ tags: "" }, { tags: null }] };
  } else if (ids && ids.length > 0) {
    whereClause = { id: { in: ids } };
  } else {
    return Response.json({ error: "Не выбраны товары" }, { status: 400 });
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    include: { category: true },
    orderBy: { name: "asc" },
  });

  if (products.length === 0) {
    return Response.json({ error: "Товары не найдены" }, { status: 404 });
  }

  const rows = products.map((p) => ({
    "Название": p.name,
    "Категория": p.category?.name || "",
    "Бренд": p.brand,
    "Цена": p.price,
    "Старая цена": p.oldPrice ?? "",
    "В наличии": p.inStock,
    "Кол-во в упаковке": p.packSize ?? "",
    "Описание": p.description,
    "Страна": p.country,
    "Штрихкод": p.barcode,
    "Код/Артикул": p.code,
    "Вес (кг)": p.weight ?? "",
    "Объём (м³)": p.volume ?? "",
    "Цвет": p.color,
    "Тип/Вид": p.productType,
    "Годен до": p.expirationDate,
    "Теги": p.tags,
    "Изображение": p.image,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  const colWidths = [
    { wch: 40 }, // Название
    { wch: 20 }, // Категория
    { wch: 20 }, // Бренд
    { wch: 10 }, // Цена
    { wch: 12 }, // Старая цена
    { wch: 10 }, // В наличии
    { wch: 15 }, // Кол-во в упаковке
    { wch: 50 }, // Описание
    { wch: 15 }, // Страна
    { wch: 15 }, // Штрихкод
    { wch: 15 }, // Код/Артикул
    { wch: 10 }, // Вес
    { wch: 10 }, // Объём
    { wch: 12 }, // Цвет
    { wch: 15 }, // Тип/Вид
    { wch: 12 }, // Годен до
    { wch: 40 }, // Теги
    { wch: 30 }, // Изображение
  ];
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Товары");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="products_export_${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
