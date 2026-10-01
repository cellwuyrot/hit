import { checkoutBody, checkoutUser, checkoutFailure, createCheckoutOrder } from "@/lib/checkout";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";
import { sendOrderNotificationToAdmin, sendOrderConfirmationToClient } from "@/lib/email";

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: { userId },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(orders);
}

export async function POST(request: Request) {
  try {
    const userId = checkoutUser(request);
    const body = await checkoutBody(request);
    const order = await createCheckoutOrder(userId, body);
    // Уведомления отправляются только после коммита; сбой SMTP не откатывает заказ.
    void sendOrderNotificationToAdmin(order, order.email).catch(console.error);
    if (order.email) void sendOrderConfirmationToClient(order.email, order).catch(console.error);
    return Response.json({ id: order.id, subtotal: order.subtotal, total: order.total, discount: order.discount, promoCode: order.promoCode }, { status: 201 });
  } catch (error) { return checkoutFailure(error); }
}
