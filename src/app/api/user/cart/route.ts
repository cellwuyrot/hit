import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";

const MAX_QUANTITY = 10_000;

function getUserId(request: Request): string | null {
  return getUserIdFromRequest(request);
}

/**
 * Количество должно быть целым положительным числом.
 * Раньше использовалось `quantity || 1`, из-за чего отрицательные значения
 * (`-5 || 1` === -5) проходили насквозь и уменьшали сумму заказа.
 */
function parseQuantity(value: unknown, fallback = 1): number | null {
  if (value === undefined || value === null || value === "") return fallback;
  const qty = Number(value);
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QUANTITY) return null;
  return qty;
}

export async function GET(request: Request) {
  const userId = getUserId(request);
  if (!userId) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: { include: { category: true } } },
    orderBy: { product: { name: "asc" } },
  });
  return Response.json(items);
}

export async function POST(request: Request) {
  const userId = getUserId(request);
  if (!userId) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { productId, quantity, isPack } = await request.json();
  if (!productId) return Response.json({ error: "Не указан товар" }, { status: 400 });

  const qty = parseQuantity(quantity);
  if (qty === null) return Response.json({ error: "Некорректное количество" }, { status: 400 });

  // Проверяем существование товара явно, чтобы вместо 500 от FK-констрейнта
  // вернуть понятную ошибку.
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return Response.json({ error: "Товар не найден" }, { status: 404 });

  const pack = !!isPack;
  const item = await prisma.cartItem.upsert({
    where: { userId_productId_isPack: { userId, productId, isPack: pack } },
    update: { quantity: { increment: qty } },
    create: { userId, productId, quantity: qty, isPack: pack },
    include: { product: true },
  });
  return Response.json(item);
}

export async function PUT(request: Request) {
  const userId = getUserId(request);
  if (!userId) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { productId, quantity, isPack } = await request.json();
  if (!productId) return Response.json({ error: "Не указан товар" }, { status: 400 });

  const qty = parseQuantity(quantity, 0);
  if (!qty) return Response.json({ error: "Некорректное количество" }, { status: 400 });

  const pack = !!isPack;

  if (pack) {
    // Для упаковок количество обязано быть кратно packSize —
    // иначе цена и подпись «N уп.» расходятся между собой.
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { packSize: true },
    });
    const packSize = product?.packSize ?? 0;
    if (packSize > 1 && qty % packSize !== 0) {
      return Response.json(
        { error: `Количество должно быть кратно упаковке (${packSize} шт.)` },
        { status: 400 }
      );
    }
  }

  const item = await prisma.cartItem.update({
    where: { userId_productId_isPack: { userId, productId, isPack: pack } },
    data: { quantity: qty },
    include: { product: true },
  });
  return Response.json(item);
}

export async function DELETE(request: Request) {
  const userId = getUserId(request);
  if (!userId) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { productId, isPack } = await request.json();
  if (productId) {
    const pack = isPack !== undefined ? !!isPack : false;
    await prisma.cartItem.delete({ where: { userId_productId_isPack: { userId, productId, isPack: pack } } });
  } else {
    await prisma.cartItem.deleteMany({ where: { userId } });
  }
  return Response.json({ ok: true });
}
