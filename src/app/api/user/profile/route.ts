import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  const token = getTokenFromRequest(request);
  if (!token) return Response.json({ error: "Не авторизован" }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || payload.role !== "user") return Response.json({ error: "Не авторизован" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, email: true, name: true, lastName: true, phone: true, address: true, createdAt: true },
  });
  if (!user) return Response.json({ error: "Пользователь не найден" }, { status: 404 });
  return Response.json(user);
}

export async function PUT(request: Request) {
  const token = getTokenFromRequest(request);
  if (!token) return Response.json({ error: "Не авторизован" }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || payload.role !== "user") return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { name, lastName, phone, address } = await request.json();
  const user = await prisma.user.update({
    where: { id: payload.id },
    data: { name, lastName, phone, address },
    select: { id: true, email: true, name: true, lastName: true, phone: true, address: true },
  });
  return Response.json(user);
}
