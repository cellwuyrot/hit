import { checkoutBody, checkoutUser, checkoutFailure, createCheckoutOrder } from "@/lib/checkout";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";
import { sendOrderNotificationToAdmin, sendOrderConfirmationToClient } from "@/lib/email";

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: { userId },
    // Internal notes must never be returned to a customer, even through the API.
    omit: { adminNote: true },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(orders);
}

export async function POST(request: Request) {
  try {
    const userId = checkoutUser(request);
    const body = await checkoutBody(request);
    const requestKey = request.headers.get("Idempotency-Key") || undefined;
    if (requestKey && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestKey)) return Response.json({ error: "Некорректный ключ заказа" }, { status: 400 });
    const order = await createCheckoutOrder(userId, body, requestKey);
    // Уведомления отправляются только после коммита; сбой SMTP не откатывает заказ.
    if (!order.replayed) void sendOrderNotificationToAdmin(order, order.email).catch(console.error);
    if (!order.replayed && order.email) void sendOrderConfirmationToClient(order.email, order).catch(console.error);
    return Response.json({ id: order.id, subtotal: order.subtotal, total: order.total, discount: order.discount, promoCode: order.promoCode }, { status: 201 });
  } catch (error) { return checkoutFailure(error); }
}
