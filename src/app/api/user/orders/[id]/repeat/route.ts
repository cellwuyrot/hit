import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
function getUserId(request: Request): string | null {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.role !== "user") return null;
  return payload.id;
}

// POST /api/user/orders/[id]/repeat
// Re-adds all items of a previous order into the user's cart so the client
// can review/edit (add, remove, change quantity) on the /cart page before
// checking out again. Idempotent: quantities are set to the order's values.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserId(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order || order.userId !== userId) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  let added = 0;
  let skipped = 0;

  for (const item of order.items) {
    // Skip products that no longer exist (deleted from catalog)
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product) {
      skipped++;
      continue;
    }

    await prisma.cartItem.upsert({
      where: {
        userId_productId_isPack: {
          userId,
          productId: item.productId,
          isPack: false,
        },
      },
      update: { quantity: item.quantity },
      create: {
        userId,
        productId: item.productId,
        isPack: false,
        quantity: item.quantity,
      },
    });
    added++;
  }

  return Response.json({ ok: true, added, skipped });
}
