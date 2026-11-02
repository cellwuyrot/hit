import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { slugify } from "@/lib/slugify";

function checkAdmin(request: Request): boolean {
  const token = getTokenFromRequest(request);
  if (!token) return false;
  const payload = verifyToken(token);
  return !!payload && payload.role === "admin";
}

export async function GET(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return Response.json(categories);
}

/** Подбирает свободный слаг: base, base-2, base-3 … (excludeId — при обновлении). */
async function uniqueCategorySlug(base: string, excludeId?: string): Promise<string> {
  let slug = base;
  let counter = 2;
  while (true) {
    const existing = await prisma.category.findFirst({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${counter++}`;
  }
}

export async function POST(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const { name, icon, order, parentId, metaTitle, metaDescription, seoText } = await request.json();
  if (!name) {
    return Response.json({ error: "Название обязательно" }, { status: 400 });
  }

  if (parentId) {
    const parent = await prisma.category.findUnique({ where: { id: parentId } });
    if (!parent || parent.parentId) return Response.json({ error: "Выберите существующую корневую категорию" }, { status: 400 });
  }
  const slug = await uniqueCategorySlug(slugify(name));
  const category = await prisma.category.create({
    data: {
      name, slug, icon: icon || "", order: order || 0, parentId: parentId || null,
      metaTitle: metaTitle || "", metaDescription: metaDescription || "", seoText: seoText || "",
    },
  });
  return Response.json(category, { status: 201 });
}

export async function PUT(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const { id, name, icon, order, parentId, metaTitle, metaDescription, seoText } = await request.json();
  if (!id || !name) {
    return Response.json({ error: "ID и название обязательны" }, { status: 400 });
  }

  const existing = await prisma.category.findUnique({ where: { id }, include: { _count: { select: { children: true } } } });
  if (!existing) return Response.json({ error: "Категория не найдена" }, { status: 404 });
  if ((parentId || null) !== existing.parentId) return Response.json({ error: "Перемещение меняет адрес страницы. Сначала подготовьте карту перенаправлений." }, { status: 409 });
  const slug = existing.slug;
  const category = await prisma.category.update({
    where: { id },
    data: {
      name, slug, icon: icon || "", order: order || 0, parentId: parentId || null,
      metaTitle: metaTitle || "", metaDescription: metaDescription || "", seoText: seoText || "",
    },
  });
  return Response.json(category);
}

export async function DELETE(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const { id } = await request.json();
  if (!id) {
    return Response.json({ error: "ID обязателен" }, { status: 400 });
  }

  // Check and delete in one database operation to avoid a gap between counting
  // products and deleting the category.
  const result = await prisma.category.deleteMany({ where: { id, products: { none: {} }, children: { none: {} } } });
  if (!result.count) return Response.json({ error: "Категория не найдена или не пуста. Сначала перенесите товары и подкатегории." }, { status: 409 });
  return Response.json({ success: true });
}
