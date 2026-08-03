import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";
import { sendOrderNotificationToAdmin, sendOrderConfirmationToClient } from "@/lib/email";

const PACK_DISCOUNT = 0.9;

/** Стоимость позиции — ровно та же формула, что показывается в корзине и на оформлении. */
function lineTotal(price: number, quantity: number, isPack: boolean): number {
  return isPack ? Math.round(price * quantity * PACK_DISCOUNT) : price * quantity;
}

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
  const userId = getUserIdFromRequest(request);
  if (!userId) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { name, phone, address, comment, promoCode } = await request.json();
  if (!name || !phone || !address) {
    return Response.json({ error: "Заполните имя, телефон и адрес" }, { status: 400 });
  }

  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
  });

  if (cartItems.length === 0) {
    return Response.json({ error: "Корзина пуста" }, { status: 400 });
  }

  // Остатки проверяем на сервере: раньше заказ создавался всегда,
  // а inStock никогда не уменьшался — товар можно было продать бесконечно.
  const outOfStock = cartItems.filter((item) => item.quantity > item.product.inStock);
  if (outOfStock.length > 0) {
    return Response.json(
      {
        error: `Недостаточно товара на складе: ${outOfStock
          .map((i) => `${i.product.name} (доступно ${i.product.inStock})`)
          .join(", ")}`,
      },
      { status: 409 }
    );
  }

  // Сумма считается по данным из БД, а не по числу, присланному клиентом.
  const subtotal = cartItems.reduce(
    (sum, item) => sum + lineTotal(item.product.price, item.quantity, item.isPack),
    0
  );

  let appliedPromo = "";
  let discount = 0;

  if (promoCode && String(promoCode).trim()) {
    const code = String(promoCode).toUpperCase().trim();
    const promo = await prisma.promoCode.findUnique({ where: { code } });
    const usable =
      promo &&
      promo.active &&
      (!promo.expiresAt || promo.expiresAt >= new Date()) &&
      (promo.maxUses === 0 || promo.usedCount < promo.maxUses) &&
      subtotal >= promo.minOrder;

    if (usable && promo) {
      discount =
        promo.discountType === "percent"
          ? Math.round((subtotal * promo.discountValue) / 100)
          : promo.discountValue;
      discount = Math.min(discount, subtotal);
      appliedPromo = promo.code;
    }
  }

  const total = Math.max(0, subtotal - discount);

  const result = await prisma
    .$transaction(async (tx) => {
      // Списываем остатки условно: если товар успели купить параллельно,
      // count будет 0 и вся транзакция откатится.
      for (const item of cartItems) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, inStock: { gte: item.quantity } },
          data: { inStock: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          throw new Error(`OUT_OF_STOCK:${item.product.name}`);
        }
      }

      const created = await tx.order.create({
        data: {
          userId,
          total,
          promoCode: appliedPromo,
          discount,
          name,
          phone,
          address,
          comment: comment || "",
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              // Фактическая цена за единицу с учётом упаковочной скидки.
              price: item.isPack ? item.product.price * PACK_DISCOUNT : item.product.price,
            })),
          },
        },
        include: { items: { include: { product: true } }, user: { select: { email: true } } },
      });

      if (appliedPromo) {
        await tx.promoCode.update({
          where: { code: appliedPromo },
          data: { usedCount: { increment: 1 } },
        });
      }

      await tx.cartItem.deleteMany({ where: { userId } });

      return created;
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "";
      if (message.startsWith("OUT_OF_STOCK:")) {
        return { conflictProduct: message.slice("OUT_OF_STOCK:".length) };
      }
      throw error;
    });

  if ("conflictProduct" in result) {
    return Response.json(
      { error: `Товар «${result.conflictProduct}» только что закончился. Обновите корзину.` },
      { status: 409 }
    );
  }

  const order = result;
  const customerEmail = order.user.email;
  sendOrderNotificationToAdmin(order, customerEmail);
  sendOrderConfirmationToClient(customerEmail, order);

  return Response.json(order);
}
