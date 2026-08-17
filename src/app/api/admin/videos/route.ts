import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { extractYouTubeId } from "@/lib/youtube";

function checkAdmin(request: Request): boolean {
  const token = getTokenFromRequest(request);
  if (!token) return false;
  const payload = verifyToken(token);
  return !!payload && payload.role === "admin";
}

// Форма записи для админки: вместе с видео отдаём краткую карточку товара,
// чтобы список сразу показывал, к чему прикреплено видео, без второго запроса.
function serialize(v: {
  id: string;
  title: string;
  description: string;
  url: string;
  videoId: string;
  order: number;
  active: boolean;
  createdAt: Date;
  product: { id: string; name: string; slug: string; image: string; code: string } | null;
}) {
  return {
    id: v.id,
    title: v.title,
    description: v.description,
    url: v.url,
    videoId: v.videoId,
    order: v.order,
    active: v.active,
    createdAt: v.createdAt.toISOString(),
    product: v.product
      ? { id: v.product.id, name: v.product.name, slug: v.product.slug, image: v.product.image, code: v.product.code }
      : null,
  };
}

const productSelect = { id: true, name: true, slug: true, image: true, code: true } as const;

// GET /api/admin/videos           — все видео
// GET /api/admin/videos?productId — видео одного товара
export async function GET(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const productId = new URL(request.url).searchParams.get("productId");

  const videos = await prisma.productVideo.findMany({
    where: productId ? { productId } : undefined,
    // Сначала ручной порядок внутри товара, потом новые сверху — так же, как на сайте.
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: { product: { select: productSelect } },
  });

  return Response.json(videos.map(serialize));
}

// POST — прикрепить видео с YouTube к товару.
export async function POST(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const body = await request.json();
  const { productId, url, title, description, order, active } = body as {
    productId?: string;
    url?: string;
    title?: string;
    description?: string;
    order?: number | string;
    active?: boolean;
  };

  if (!productId) return Response.json({ error: "Выберите товар" }, { status: 400 });
  if (!url || !String(url).trim()) return Response.json({ error: "Вставьте ссылку на видео YouTube" }, { status: 400 });

  const videoId = extractYouTubeId(String(url));
  if (!videoId) {
    return Response.json(
      { error: "Не удалось распознать ссылку YouTube. Пример: youtube.com/watch?v=XXXXXXXXXXX или youtu.be/XXXXXXXXXXX" },
      { status: 400 },
    );
  }

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) return Response.json({ error: "Товар не найден" }, { status: 404 });

  // Одно и то же видео на одном товаре — почти всегда случайный двойной клик
  // по «Добавить», поэтому проверяем явно и даём понятное сообщение.
  const duplicate = await prisma.productVideo.findFirst({ where: { productId, videoId }, select: { id: true } });
  if (duplicate) return Response.json({ error: "Это видео уже прикреплено к этому товару" }, { status: 400 });

  // Новое видео встаёт в конец списка товара, если порядок не задан вручную.
  let nextOrder = Number(order);
  if (!Number.isFinite(nextOrder)) {
    const last = await prisma.productVideo.findFirst({
      where: { productId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    nextOrder = last ? last.order + 1 : 0;
  }

  const video = await prisma.productVideo.create({
    data: {
      productId,
      url: String(url).trim(),
      videoId,
      title: (title || "").trim(),
      description: (description || "").trim(),
      order: nextOrder,
      active: active !== false,
    },
    include: { product: { select: productSelect } },
  });

  return Response.json(serialize(video), { status: 201 });
}

// PUT — обновить видео: ссылка, название, описание, товар, порядок, видимость.
export async function PUT(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const body = await request.json();
  const { id } = body as { id?: string };
  if (!id) return Response.json({ error: "ID обязателен" }, { status: 400 });

  const data: Record<string, unknown> = {};

  if (body.url !== undefined) {
    const videoId = extractYouTubeId(String(body.url));
    if (!videoId) return Response.json({ error: "Не удалось распознать ссылку YouTube" }, { status: 400 });
    data.url = String(body.url).trim();
    data.videoId = videoId;
  }
  if (body.title !== undefined) data.title = String(body.title).trim();
  if (body.description !== undefined) data.description = String(body.description).trim();
  if (body.active !== undefined) data.active = !!body.active;
  if (body.order !== undefined && Number.isFinite(Number(body.order))) data.order = Number(body.order);

  // Перепривязка к другому товару — проверяем, что товар существует.
  if (body.productId !== undefined) {
    const product = await prisma.product.findUnique({ where: { id: String(body.productId) }, select: { id: true } });
    if (!product) return Response.json({ error: "Товар не найден" }, { status: 404 });
    data.productId = product.id;
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ error: "Нет данных для обновления" }, { status: 400 });
  }

  const video = await prisma.productVideo.update({
    where: { id },
    data,
    include: { product: { select: productSelect } },
  });

  return Response.json(serialize(video));
}

// PATCH — перестановка видео внутри товара (тот же контракт, что у слайдера).
export async function PATCH(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const { orderedIds } = await request.json();
  if (!Array.isArray(orderedIds)) {
    return Response.json({ error: "orderedIds обязателен" }, { status: 400 });
  }

  await Promise.all(
    orderedIds.map((id: string, index: number) =>
      prisma.productVideo.update({ where: { id }, data: { order: index } }),
    ),
  );

  return Response.json({ success: true });
}

export async function DELETE(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const body = await request.json();
  const { id, ids } = body as { id?: string; ids?: string[] };

  if (ids && ids.length > 0) {
    const result = await prisma.productVideo.deleteMany({ where: { id: { in: ids } } });
    return Response.json({ success: true, deleted: result.count });
  }

  if (!id) return Response.json({ error: "ID обязателен" }, { status: 400 });

  await prisma.productVideo.delete({ where: { id } });
  return Response.json({ success: true, deleted: 1 });
}
