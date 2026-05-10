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
  const news = await prisma.news.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json(news);
}

export async function POST(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });
  const { title, excerpt, content, image, published, type } = await request.json();
  if (!title) return Response.json({ error: "Укажите заголовок" }, { status: 400 });

  let slug = slugify(title);
  const existing = await prisma.news.findFirst({ where: { slug } });
  if (existing) {
    let counter = 2;
    while (await prisma.news.findFirst({ where: { slug: `${slug}-${counter}` } })) {
      counter++;
    }
    slug = `${slug}-${counter}`;
  }
  const news = await prisma.news.create({
    data: { title, slug, excerpt: excerpt || "", content: content || "", image: image || "", type: type || "article", published: published ?? false },
  });
  return Response.json(news);
}

export async function PUT(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });
  const { id, title, excerpt, content, image, published, type } = await request.json();
  if (!id) return Response.json({ error: "Укажите id" }, { status: 400 });

  const news = await prisma.news.update({
    where: { id },
    data: { title, excerpt, content, image, published, type },
  });
  return Response.json(news);
}

export async function DELETE(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });
  const { id } = await request.json();
  await prisma.news.delete({ where: { id } });
  return Response.json({ ok: true });
}
