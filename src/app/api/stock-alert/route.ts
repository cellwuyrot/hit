import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";

// Раньше здесь читалось поле decoded.userId, которого в токене нет (signToken
// кладёт id), поэтому эндпоинт всегда отвечал 401. Плюс использовался
// захардкоженный запасной секрет.
function getUserId(req: NextRequest): string | null {
  return getUserIdFromRequest(req);
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId } = await req.json();
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  const existing = await prisma.stockAlert.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (existing) {
    return NextResponse.json({ already: true, message: "Вы уже подписаны на уведомление" });
  }

  await prisma.stockAlert.create({ data: { userId, productId } });
  return NextResponse.json({ success: true, message: "Вы получите уведомление о поступлении" });
}
