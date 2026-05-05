import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "tophit-secret-key-2024";

function getUserId(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (!auth) return null;
  try {
    const decoded = jwt.verify(auth.replace("Bearer ", ""), SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
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
