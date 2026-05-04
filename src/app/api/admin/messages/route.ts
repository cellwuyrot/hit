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

  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId");
  if (!orderId) return Response.json({ error: "orderId обязателен" }, { status: 400 });

  const messages = await prisma.message.findMany({
    where: { orderId },
    orderBy: { createdAt: "asc" },
  });
  return Response.json(messages);
}

export async function POST(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const token = getTokenFromRequest(request)!;
  const payload = verifyToken(token)!;
  const { orderId, text } = await request.json();
  if (!orderId || !text) return Response.json({ error: "orderId и text обязательны" }, { status: 400 });

  const message = await prisma.message.create({
    data: { orderId, senderId: payload.id, senderRole: "admin", text },
  });
  return Response.json(message);
}
