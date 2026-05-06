import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

function checkAdmin(request: Request): boolean {
  const token = getTokenFromRequest(request);
  if (!token) return false;
  const payload = verifyToken(token);
  return !!payload && payload.role === "admin";
}

export async function GET(request: Request) {
  if (checkAdmin(request)) {
    const slides = await prisma.sliderImage.findMany({ orderBy: { order: "asc" } });
    return Response.json(slides);
  }

  const slides = await prisma.sliderImage.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });
  return Response.json(slides);
}

export async function POST(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const { title, subtitle, imageUrl, link, order, active } = await request.json();
  if (!imageUrl) {
    return Response.json({ error: "URL изображения обязателен" }, { status: 400 });
  }

  const slide = await prisma.sliderImage.create({
    data: {
      title: title || "", subtitle: subtitle || "", imageUrl,
      link: link || "", order: order || 0, active: active !== false,
    },
  });
  return Response.json(slide, { status: 201 });
}

export async function PUT(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const { id, title, subtitle, imageUrl, link, order, active } = await request.json();
  if (!id) {
    return Response.json({ error: "ID обязателен" }, { status: 400 });
  }

  const slide = await prisma.sliderImage.update({
    where: { id },
    data: {
      title: title || "", subtitle: subtitle || "", imageUrl,
      link: link || "", order: order || 0, active: active !== false,
    },
  });
  return Response.json(slide);
}

export async function PATCH(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const { orderedIds } = await request.json();
  if (!Array.isArray(orderedIds)) {
    return Response.json({ error: "orderedIds обязателен" }, { status: 400 });
  }

  await Promise.all(
    orderedIds.map((id: string, index: number) =>
      prisma.sliderImage.update({ where: { id }, data: { order: index } })
    )
  );

  const slides = await prisma.sliderImage.findMany({ orderBy: { order: "asc" } });
  return Response.json(slides);
}

export async function DELETE(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const { id } = await request.json();
  if (!id) {
    return Response.json({ error: "ID обязателен" }, { status: 400 });
  }

  await prisma.sliderImage.delete({ where: { id } });
  return Response.json({ success: true });
}
