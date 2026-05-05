import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
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
