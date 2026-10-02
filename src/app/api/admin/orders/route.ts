import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { sendOrderStatusUpdate } from "@/lib/email";

function checkAdmin(request: Request): boolean {
  const token = getTokenFromRequest(request);
  if (!token) return false;
  const payload = verifyToken(token);
  return !!payload && payload.role === "admin";
}

export async function GET(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });
  const orders = await prisma.order.findMany({
    include: { user: { select: { email: true, name: true } }, items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(orders);
}

export async function PUT(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return Response.json({ error: "Некорректные данные" }, { status: 400 });
    const { id, status, trackNumber, trackUrl, adminNote } = body as Record<string, unknown>;
    if (typeof id !== "string" || !id.trim()) return Response.json({ error: "Укажите id" }, { status: 400 });
    if (adminNote !== undefined && (typeof adminNote !== "string" || adminNote.length > 5000)) {
      return Response.json({ error: "Заметка должна быть текстом не длиннее 5000 символов" }, { status: 400 });
    }
    const updateData: Record<string, string> = {};
    if (status !== undefined) {
      if (typeof status !== "string" || !["new", "processing", "shipped", "delivered", "cancelled"].includes(status)) return Response.json({ error: "Некорректный статус" }, { status: 400 });
      updateData.status = status;
    }
    for (const [field, value] of [["trackNumber", trackNumber], ["trackUrl", trackUrl]] as const) {
      if (value !== undefined) {
        if (typeof value !== "string") return Response.json({ error: "Некорректные данные отслеживания" }, { status: 400 });
        updateData[field] = value;
      }
    }
    // Only admins can write this field. Empty text intentionally clears the note.
    if (typeof adminNote === "string") updateData.adminNote = adminNote.trim();
    if (Object.keys(updateData).length === 0) return Response.json({ error: "Нечего обновлять" }, { status: 400 });
    const order = await prisma.order.update({
      where: { id }, data: updateData,
      include: { user: { select: { email: true } } },
    });
    // A private note is not a customer-facing message and triggers no email.
    if ((status || trackNumber) && (order.email || order.user?.email)) {
      void sendOrderStatusUpdate(order.email || order.user?.email || "", order.id, order.status, order.trackNumber || undefined, order.trackUrl || undefined).catch(console.error);
    }
    return Response.json(order);
  } catch (error) {
    if (error instanceof SyntaxError) return Response.json({ error: "Некорректный JSON" }, { status: 400 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return Response.json({ error: "Заказ не найден" }, { status: 404 });
    console.error("Order update failed:", error);
    return Response.json({ error: "Не удалось сохранить заказ" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });
  const { id } = await request.json();
  if (!id) return Response.json({ error: "Укажите id" }, { status: 400 });
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return Response.json({ error: "Заказ не найден" }, { status: 404 });
  if (order.status !== "cancelled" && order.status !== "delivered") {
    return Response.json({ error: "Удалять можно только отменённые или завершённые заказы" }, { status: 400 });
  }
  await prisma.order.delete({ where: { id } });
  return Response.json({ success: true });
}
