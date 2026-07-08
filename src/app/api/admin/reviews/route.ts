import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

function checkAdmin(request: Request): boolean {
  const token = getTokenFromRequest(request);
  if (!token) return false;
  const payload = verifyToken(token);
  return !!payload && payload.role === "admin";
}

// Turn a review row (with its product and optional user) into the shape used by the admin UI.
function serialize(r: {
  id: string;
  rating: number;
  text: string;
  authorName: string;
  adminReply: string;
  published: boolean;
  createdAt: Date;
  userId: string | null;
  user: { name: string; email: string } | null;
  product: { id: string; name: string; slug: string; image: string } | null;
}) {
  const displayName =
    r.authorName ||
    r.user?.name ||
    (r.user?.email ? r.user.email.split("@")[0] : "") ||
    "Покупатель";
  return {
    id: r.id,
    rating: r.rating,
    text: r.text,
    authorName: r.authorName,
    displayName,
    adminReply: r.adminReply,
    published: r.published,
    createdAt: r.createdAt.toISOString(),
    isFake: !r.userId,
    product: r.product
      ? { id: r.product.id, name: r.product.name, slug: r.product.slug, image: r.product.image }
      : null,
  };
}

export async function GET(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { id: true, name: true, slug: true, image: true } },
    },
  });

  return Response.json(reviews.map(serialize));
}

// POST — create a fictitious (admin-authored) review for a product.
export async function POST(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const body = await request.json();
  const { productId, authorName, text, rating } = body as {
    productId?: string;
    authorName?: string;
    text?: string;
    rating?: number | string;
  };

  if (!productId) return Response.json({ error: "Выберите товар для отзыва" }, { status: 400 });
  if (!text || !String(text).trim()) return Response.json({ error: "Введите текст отзыва" }, { status: 400 });

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) return Response.json({ error: "Товар не найден" }, { status: 404 });

  const ratingNum = Math.min(5, Math.max(1, Number(rating) || 5));

  const review = await prisma.review.create({
    data: {
      productId,
      userId: null,
      authorName: (authorName || "").trim(),
      text: String(text).trim(),
      rating: ratingNum,
      published: true,
    },
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { id: true, name: true, slug: true, image: true } },
    },
  });

  return Response.json(serialize(review), { status: 201 });
}

// PUT — update a review: admin reply, publish toggle, or edit fields.
export async function PUT(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const body = await request.json();
  const { id } = body as { id?: string };
  if (!id) return Response.json({ error: "ID обязателен" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (body.adminReply !== undefined) data.adminReply = String(body.adminReply);
  if (body.published !== undefined) data.published = !!body.published;
  if (body.text !== undefined) data.text = String(body.text);
  if (body.authorName !== undefined) data.authorName = String(body.authorName);
  if (body.rating !== undefined) data.rating = Math.min(5, Math.max(1, Number(body.rating) || 5));

  if (Object.keys(data).length === 0) {
    return Response.json({ error: "Нет данных для обновления" }, { status: 400 });
  }

  const review = await prisma.review.update({
    where: { id },
    data,
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { id: true, name: true, slug: true, image: true } },
    },
  });

  return Response.json(serialize(review));
}

export async function DELETE(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const body = await request.json();
  const { id, ids } = body as { id?: string; ids?: string[] };

  if (ids && ids.length > 0) {
    const result = await prisma.review.deleteMany({ where: { id: { in: ids } } });
    return Response.json({ success: true, deleted: result.count });
  }

  if (!id) return Response.json({ error: "ID обязателен" }, { status: 400 });

  await prisma.review.delete({ where: { id } });
  return Response.json({ success: true, deleted: 1 });
}
