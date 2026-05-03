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

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });
  return Response.json(products);
}

export async function POST(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const body = await request.json();
  const { name, description, price, oldPrice, image, inStock, brand, color, productType, categoryId } = body;

  if (!name || !price || !categoryId) {
    return Response.json({ error: "Название, цена и категория обязательны" }, { status: 400 });
  }

  const slug = slugify(name) + "-" + Date.now();
  const product = await prisma.product.create({
    data: {
      name, slug, description: description || "", price: Number(price),
      oldPrice: oldPrice ? Number(oldPrice) : null, image: image || "",
      inStock: Number(inStock) || 0, brand: brand || "", color: color || "",
      productType: productType || "", categoryId,
    },
  });
  return Response.json(product, { status: 201 });
}

export async function PUT(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const body = await request.json();

  // Bulk category assignment
  if (body.ids && body.categoryId) {
    const result = await prisma.product.updateMany({
      where: { id: { in: body.ids } },
      data: { categoryId: body.categoryId },
    });
    return Response.json({ success: true, updated: result.count });
  }

  const { id, name, description, price, oldPrice, image, image2, image3, image4, inStock, brand, color, productType, categoryId } = body;

  if (!id || !name || !price || !categoryId) {
    return Response.json({ error: "Обязательные поля не заполнены" }, { status: 400 });
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      name, description: description || "", price: Number(price),
      oldPrice: oldPrice ? Number(oldPrice) : null, image: image || "",
      image2: image2 || "", image3: image3 || "", image4: image4 || "",
      inStock: Number(inStock) || 0, brand: brand || "", color: color || "",
      productType: productType || "", categoryId,
    },
  });
  return Response.json(product);
}

export async function DELETE(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const body = await request.json();
  const { id, ids } = body as { id?: string; ids?: string[] };

  if (ids && ids.length > 0) {
    const result = await prisma.product.deleteMany({ where: { id: { in: ids } } });
    return Response.json({ success: true, deleted: result.count });
  }

  if (!id) {
    return Response.json({ error: "ID обязателен" }, { status: 400 });
  }

  await prisma.product.delete({ where: { id } });
  return Response.json({ success: true, deleted: 1 });
}
