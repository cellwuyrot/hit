import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MAX_TEXT = 2000;

function checkAdmin(request: Request): boolean {
  const token = getTokenFromRequest(request);
  if (!token) return false;
  const payload = verifyToken(token);
  return !!payload && payload.role === "admin";
}

// История переписки конкретного диалога. Заодно помечаем сообщения гостя
// прочитанными администратором (обнуляет счётчик непрочитанных).
export async function GET(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const url = new URL(request.url);
  const chatId = url.searchParams.get("chatId");
  if (!chatId) return Response.json({ error: "chatId обязателен" }, { status: 400 });

  const messages = await prisma.supportMessage.findMany({
    where: { chatId },
    orderBy: { createdAt: "asc" },
  });

  await prisma.supportMessage.updateMany({
    where: { chatId, senderRole: "guest", readByAdmin: false },
    data: { readByAdmin: true },
  });

  return Response.json(messages);
}

// Администратор отвечает гостю.
export async function POST(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const { chatId, text } = await request.json();
  if (!chatId) return Response.json({ error: "chatId обязателен" }, { status: 400 });

  const chat = await prisma.supportChat.findUnique({ where: { id: chatId } });
  if (!chat) return Response.json({ error: "Чат не найден" }, { status: 404 });

  const clean = (text || "").toString().trim().slice(0, MAX_TEXT);
  if (!clean) return Response.json({ error: "Пустое сообщение" }, { status: 400 });

  const message = await prisma.supportMessage.create({
    data: { chatId, senderRole: "admin", text: clean, readByAdmin: true },
  });

  await prisma.supportChat.update({
    where: { id: chatId },
    data: { lastMessageAt: message.createdAt },
  });

  return Response.json(message);
}
