import { parseOrderDetails, OrderDetailsError } from "@/lib/order-options";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { getUserIdFromRequest, getTokenFromRequest } from "@/lib/auth";

export class CheckoutError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function checkoutUser(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (request.headers.has("authorization") && (!getTokenFromRequest(request) || !userId)) throw new CheckoutError("Сессия истекла. Войдите снова или выйдите из аккаунта для гостевого заказа", 401);
  return userId;
}
export async function checkoutBody(request: Request): Promise<Record<string, unknown>> {
  const body: unknown = await request.json();
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new CheckoutError("Некорректные данные заказа");
  return body as Record<string, unknown>;
}
export function checkoutFailure(error: unknown) {
  if (error instanceof CheckoutError) return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof SyntaxError) return Response.json({ error: "Некорректный JSON" }, { status: 400 });
  console.error("Checkout failed:", error);
  return Response.json({ error: "Не удалось обработать заказ. Попробуйте ещё раз" }, { status: 500 });
}
const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
type InputItem = { productId: string; quantity: number; isPack: boolean };
function parseItems(value: unknown): InputItem[] {
  if (!Array.isArray(value) || value.length > 200) throw new CheckoutError("Некорректная корзина");
  const map = new Map<string, InputItem>();
  for (const row of value) {
    if (!row || typeof row.productId !== "string" || !row.productId ||
        !Number.isInteger(row.quantity) || row.quantity < 1 || row.quantity > 10_000 ||
        (row.isPack !== undefined && typeof row.isPack !== "boolean")) throw new CheckoutError("Некорректный товар или количество");
    const item = { productId: row.productId, quantity: row.quantity, isPack: row.isPack === true };
    const key = JSON.stringify([item.productId, item.isPack]);
    const old = map.get(key);
    item.quantity += old?.quantity ?? 0;
    if (item.quantity > 10_000) throw new CheckoutError("Слишком большое количество товара");
    map.set(key, item);
  }
  return [...map.values()];
}
function text(value: unknown, max: number, label: string) {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string" || value.length > max) throw new CheckoutError(`Некорректное поле: ${label}`);
  return value.trim();
}

/** Единственный источник цен, упаковочных скидок, остатков и правил промокодов. */
async function calculate(tx: Prisma.TransactionClient, userId: string | null, input: unknown, codeInput: unknown, allowEmpty = false) {
  const raw = userId ? await tx.cartItem.findMany({ where: { userId } }) : input;
  const lines = parseItems(raw);
  if (!lines.length && !allowEmpty) throw new CheckoutError("Корзина пуста");
  const products = await tx.product.findMany({ where: { id: { in: lines.map(i => i.productId) } } });
  const quantities = new Map<string, number>();
  const items = lines.map(line => {
    const product = products.find(p => p.id === line.productId);
    if (!product) throw new CheckoutError("Товар удалён из каталога. Удалите его из корзины", 409);
    if (!Number.isFinite(product.price) || product.price < 0) throw new CheckoutError("Некорректная цена товара", 409);
    if (line.isPack && (!product.packSize || product.packSize <= 1 || line.quantity % product.packSize !== 0)) {
      throw new CheckoutError(`Количество «${product.name}» должно быть кратно действующей упаковке`, 400);
    }
    quantities.set(product.id, (quantities.get(product.id) ?? 0) + line.quantity);
    // Сохраняем прежнее округление упаковочной скидки до рубля.
    const lineTotal = line.isPack ? Math.round(product.price * line.quantity * 0.9) : money(product.price * line.quantity);
    return { ...line, id: `${line.productId}:${line.isPack}`, product, lineTotal };
  });
  for (const product of products) {
    if (!allowEmpty && (quantities.get(product.id) ?? 0) > product.inStock) throw new CheckoutError(`Недостаточно товара «${product.name}»: доступно ${product.inStock} шт.`, 409);
  }
  const subtotal = money(items.reduce((s, i) => s + i.lineTotal, 0));
  const code = text(codeInput, 64, "Промокод").toUpperCase();
  const promo = code ? await tx.promoCode.findUnique({ where: { code } }) : null;
  let discount = 0;
  if (code) {
    const now = new Date();
    if (!promo) throw new CheckoutError("Промокод не найден");
    if (!promo.active) throw new CheckoutError("Промокод отключён");
    if (promo.startsAt && promo.startsAt > now) throw new CheckoutError("Промокод ещё не начал действовать");
    if (promo.expiresAt && promo.expiresAt < now) throw new CheckoutError("Срок действия промокода истёк");
    if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) throw new CheckoutError("Лимит использований промокода исчерпан");
    if (subtotal < promo.minOrder) throw new CheckoutError(`Промокод действует от ${promo.minOrder.toLocaleString("ru-RU")} ₽`);
    if (!["percent", "fixed"].includes(promo.discountType) || !Number.isFinite(promo.discountValue) || promo.discountValue <= 0 || (promo.discountType === "percent" && promo.discountValue > 100)) throw new CheckoutError("Некорректные настройки промокода");
    discount = money(Math.min(subtotal, promo.discountType === "percent" ? Math.round(subtotal * promo.discountValue / 100) : promo.discountValue));
  }
  return { items, subtotal, discount, total: money(subtotal - discount), promoCode: promo?.code ?? "", promo };
}
export async function quoteCheckout(userId: string | null, items: unknown, code?: unknown, allowEmpty = false) {
  return prisma.$transaction(async tx => {
    const quote = await calculate(tx, userId, items, code, allowEmpty);
    return { items: quote.items, subtotal: quote.subtotal, discount: quote.discount, total: quote.total, promoCode: quote.promoCode };
  });
}
export async function createCheckoutOrder(userId: string | null, body: Record<string, unknown>) {
  return prisma.$transaction(async tx => {
    const user = userId ? await tx.user.findUnique({ where: { id: userId }, select: { email: true } }) : null;
    if (userId && !user) throw new CheckoutError("Пользователь не найден", 401);
    let details;
    try { details = parseOrderDetails(body, user?.email || ""); }
    catch (error) { if (error instanceof OrderDetailsError) throw new CheckoutError(error.message); throw error; }

    const quote = await calculate(tx, userId, body.items, body.promoCode);
    for (const item of quote.items) {
      const changed = await tx.product.updateMany({ where: { id: item.productId, inStock: { gte: item.quantity } }, data: { inStock: { decrement: item.quantity } } });
      if (!changed.count) throw new CheckoutError(`Товар «${item.product.name}» закончился. Обновите корзину`, 409);
    }
    if (quote.promo) {
      const promo = quote.promo;
      const now = new Date();
      const changed = await tx.promoCode.updateMany({
        where: { id: promo.id, active: true, usedCount: promo.usedCount,
          ...(promo.maxUses > 0 ? { usedCount: { equals: promo.usedCount, lt: promo.maxUses } } : {}),
          AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] }] },
        data: { usedCount: { increment: 1 } },
      });
      if (!changed.count) throw new CheckoutError("Промокод больше недоступен. Проверьте его повторно", 409);
    }
    const order = await tx.order.create({ data: {
      userId, ...details,
      subtotal: quote.subtotal, total: quote.total, promoCode: quote.promoCode, discount: quote.discount,
      items: { create: quote.items.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.lineTotal / i.quantity })) },
    }, include: { items: { include: { product: true } } } });
    if (userId) await tx.cartItem.deleteMany({ where: { userId } });
    return order;
  }, { timeout: 15_000 });
}
