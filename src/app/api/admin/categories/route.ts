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

export async function GET(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return Response.json(categories);
}

export async function POST(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const { name, order, parentId, metaTitle, metaDescription, seoText } = await request.json();
  if (!name) {
    return Response.json({ error: "Название обязательно" }, { status: 400 });
  }

  const slug = slugify(name);
  const category = await prisma.category.create({
    data: {
      name, slug, order: order || 0, parentId: parentId || null,
      metaTitle: metaTitle || "", metaDescription: metaDescription || "", seoText: seoText || "",
    },
  });
  return Response.json(category, { status: 201 });
}

export async function PUT(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const { id, name, order, parentId, metaTitle, metaDescription, seoText } = await request.json();
  if (!id || !name) {
    return Response.json({ error: "ID и название обязательны" }, { status: 400 });
  }

  const slug = slugify(name);
  const category = await prisma.category.update({
    where: { id },
    data: {
      name, slug, order: order || 0, parentId: parentId || null,
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

  await prisma.category.delete({ where: { id } });
  return Response.json({ success: true });
}
