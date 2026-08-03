import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  // Содержит персональные данные покупателей (имя, телефон) — только для админа.
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.quickOrder.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}
