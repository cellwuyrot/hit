import { prisma } from "@/lib/prisma";
import { createChatMessageStream } from "@/lib/chatStream";

export const dynamic = "force-dynamic";

// Реалтайм-поток сообщений для гостя (SSE).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const chatId = url.searchParams.get("chatId");
  const token = url.searchParams.get("token");
  if (!chatId || !token) return new Response("Bad request", { status: 400 });

  const chat = await prisma.supportChat.findUnique({ where: { id: chatId } });
  if (!chat || chat.guestToken !== token) return new Response("Not found", { status: 404 });

  return createChatMessageStream(chat.id, request.signal);
}
