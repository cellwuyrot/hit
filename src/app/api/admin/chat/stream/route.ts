import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { createChatMessageStream } from "@/lib/chatStream";

export const dynamic = "force-dynamic";

// Реалтайм-поток сообщений для админа (SSE). EventSource не умеет ставить
// заголовок Authorization, поэтому JWT передаётся query-параметром token.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const chatId = url.searchParams.get("chatId");
  const token = url.searchParams.get("token");

  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "admin") return new Response("Unauthorized", { status: 401 });
  if (!chatId) return new Response("Bad request", { status: 400 });

  const chat = await prisma.supportChat.findUnique({ where: { id: chatId } });
  if (!chat) return new Response("Not found", { status: 404 });

  return createChatMessageStream(chat.id, request.signal);
}
