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

  const pages = await prisma.sitePage.findMany({ orderBy: { slug: "asc" } });
  return Response.json(pages);
}

export async function PUT(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const { slug, title, content } = await request.json();
  if (!slug) return Response.json({ error: "Slug обязателен" }, { status: 400 });

  const page = await prisma.sitePage.upsert({
    where: { slug },
    create: { slug, title: title || "", content: content || "" },
    update: { title: title || "", content: content || "" },
  });
  return Response.json(page);
}
