import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MAX_TEXT = 2000;

// Проверяет пару chatId + guestToken и возвращает чат либо null.
async function resolveChat(chatId: string | null, token: string | null) {
  if (!chatId || !token) return null;
  const chat = await prisma.supportChat.findUnique({ where: { id: chatId } });
  if (!chat || chat.guestToken !== token) return null;
  return chat;
}

// История сообщений гостя. Заодно помечаем ответы администратора прочитанными.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const chat = await resolveChat(url.searchParams.get("chatId"), url.searchParams.get("token"));
  if (!chat) return Response.json({ error: "Чат не найден" }, { status: 404 });

  const messages = await prisma.supportMessage.findMany({
    where: { chatId: chat.id },
    orderBy: { createdAt: "asc" },
  });

  await prisma.supportMessage.updateMany({
    where: { chatId: chat.id, senderRole: "admin", readByGuest: false },
    data: { readByGuest: true },
  });

  return Response.json(messages);
}

// Гость отправляет сообщение.
export async function POST(request: Request) {
  let body: { chatId?: string; token?: string; text?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const chat = await resolveChat(body.chatId ?? null, body.token ?? null);
  if (!chat) return Response.json({ error: "Чат не найден" }, { status: 404 });

  const text = (body.text || "").toString().trim().slice(0, MAX_TEXT);
  if (!text) return Response.json({ error: "Пустое сообщение" }, { status: 400 });

  const message = await prisma.supportMessage.create({
    data: { chatId: chat.id, senderRole: "guest", text, readByGuest: true },
  });

  await prisma.supportChat.update({
    where: { id: chat.id },
    data: { lastMessageAt: message.createdAt, status: "open" },
  });

  return Response.json(message);
}
