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

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json([], { status: 401 });

  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { category: true },
  });

  const result = items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return { ...item, product };
  }).filter((i) => i.product);

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId } = await req.json();
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    return NextResponse.json({ action: "removed" });
  }

  await prisma.wishlistItem.create({ data: { userId, productId } });
  return NextResponse.json({ action: "added" });
}

export async function DELETE(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId } = await req.json();
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  await prisma.wishlistItem.deleteMany({ where: { userId, productId } });
  return NextResponse.json({ success: true });
}
