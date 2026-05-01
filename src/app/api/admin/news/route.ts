import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

function checkAdmin(request: Request): boolean {
  const token = getTokenFromRequest(request);
  if (!token) return false;
  const payload = verifyToken(token);
  return !!payload && payload.role === "admin";
}

export async function GET(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });
  const news = await prisma.news.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json(news);
}

export async function POST(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });
  const { title, content, image, published, type } = await request.json();
  if (!title) return Response.json({ error: "Укажите заголовок" }, { status: 400 });

  const slug = title.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, "-").replace(/^-|-$/g, "") + "-" + Date.now();
  const news = await prisma.news.create({
    data: { title, slug, content: content || "", image: image || "", type: type || "article", published: published ?? false },
  });
  return Response.json(news);
}

export async function PUT(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });
  const { id, title, content, image, published, type } = await request.json();
  if (!id) return Response.json({ error: "Укажите id" }, { status: 400 });

  const news = await prisma.news.update({
    where: { id },
    data: { title, content, image, published, type },
  });
  return Response.json(news);
}

export async function DELETE(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });
  const { id } = await request.json();
  await prisma.news.delete({ where: { id } });
  return Response.json({ ok: true });
}
