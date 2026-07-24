import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Гость начинает чат: вводит имя и получает секретный токен, по которому
// продолжает переписку (учётная запись и заказы не требуются).
export async function POST(request: Request) {
  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const guestName = (body.name || "").toString().trim().slice(0, 60) || "Гость";
  const guestToken = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "");

  const chat = await prisma.supportChat.create({
    data: { guestName, guestToken },
  });

  return Response.json({ chatId: chat.id, token: guestToken, guestName });
}
