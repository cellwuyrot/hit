import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  // Без проверки любой желающий мог подменить трек-номер и ссылку отслеживания
  // у произвольного заказа (в т.ч. подставить фишинговый URL).
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId, trackNumber, trackUrl } = await req.json();

  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      trackNumber: trackNumber || "",
      trackUrl: trackUrl || "",
    },
  });

  return NextResponse.json(updated);
}
