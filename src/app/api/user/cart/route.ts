import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

function getUserId(request: Request): string | null {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.role !== "user") return null;
  return payload.id;
}

export async function GET(request: Request) {
  const userId = getUserId(request);
  if (!userId) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: { include: { category: true } } },
    orderBy: { product: { name: "asc" } },
  });
  return Response.json(items);
}

export async function POST(request: Request) {
  const userId = getUserId(request);
  if (!userId) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { productId, quantity } = await request.json();
  if (!productId) return Response.json({ error: "Не указан товар" }, { status: 400 });

  const item = await prisma.cartItem.upsert({
    where: { userId_productId: { userId, productId } },
    update: { quantity: { increment: quantity || 1 } },
    create: { userId, productId, quantity: quantity || 1 },
    include: { product: true },
  });
  return Response.json(item);
}

export async function PUT(request: Request) {
  const userId = getUserId(request);
  if (!userId) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { productId, quantity } = await request.json();
  if (!productId || quantity < 1) return Response.json({ error: "Неверные данные" }, { status: 400 });

  const item = await prisma.cartItem.update({
    where: { userId_productId: { userId, productId } },
    data: { quantity },
    include: { product: true },
  });
  return Response.json(item);
}

export async function DELETE(request: Request) {
  const userId = getUserId(request);
  if (!userId) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { productId } = await request.json();
  if (productId) {
    await prisma.cartItem.delete({ where: { userId_productId: { userId, productId } } });
  } else {
    await prisma.cartItem.deleteMany({ where: { userId } });
  }
  return Response.json({ ok: true });
}
