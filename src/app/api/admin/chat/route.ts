import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

function checkAdmin(request: Request): boolean {
  const token = getTokenFromRequest(request);
  if (!token) return false;
  const payload = verifyToken(token);
  return !!payload && payload.role === "admin";
}

// Список диалогов для админки. По умолчанию — активные, ?status=closed — история.
export async function GET(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const url = new URL(request.url);
  const status = url.searchParams.get("status"); // open | closed | all

  const chats = await prisma.supportChat.findMany({
    where: status && status !== "all" ? { status } : undefined,
    orderBy: { lastMessageAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: {
        select: { messages: { where: { senderRole: "guest", readByAdmin: false } } },
      },
    },
  });

  const result = chats.map((c) => ({
    id: c.id,
    guestName: c.guestName,
    status: c.status,
    createdAt: c.createdAt,
    lastMessageAt: c.lastMessageAt,
    lastMessage: c.messages[0]
      ? { text: c.messages[0].text, senderRole: c.messages[0].senderRole, createdAt: c.messages[0].createdAt }
      : null,
    unread: c._count.messages,
  }));

  return Response.json(result);
}

// Смена статуса диалога (в архив / вернуть в активные).
export async function PATCH(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const { id, status } = await request.json();
  if (!id || !["open", "closed"].includes(status)) {
    return Response.json({ error: "Некорректные данные" }, { status: 400 });
  }

  const updated = await prisma.supportChat.update({ where: { id }, data: { status } });
  return Response.json(updated);
}

// Удаление диалога вместе с историей сообщений.
export async function DELETE(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return Response.json({ error: "id обязателен" }, { status: 400 });

  await prisma.supportChat.delete({ where: { id } });
  return Response.json({ success: true });
}
