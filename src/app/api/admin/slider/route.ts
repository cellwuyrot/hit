import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  const token = getTokenFromRequest(request);
  const isAdmin = token && verifyToken(token);

  if (isAdmin) {
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
  const token = getTokenFromRequest(request);
  if (!token || !verifyToken(token)) {
    return Response.json({ error: "Не авторизован" }, { status: 401 });
  }

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
  const token = getTokenFromRequest(request);
  if (!token || !verifyToken(token)) {
    return Response.json({ error: "Не авторизован" }, { status: 401 });
  }

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

export async function DELETE(request: Request) {
  const token = getTokenFromRequest(request);
  if (!token || !verifyToken(token)) {
    return Response.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { id } = await request.json();
  if (!id) {
    return Response.json({ error: "ID обязателен" }, { status: 400 });
  }

  await prisma.sliderImage.delete({ where: { id } });
  return Response.json({ success: true });
}
