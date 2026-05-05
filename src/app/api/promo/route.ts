import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { code } = await req.json();

  if (!code) return NextResponse.json({ error: "Код не указан" }, { status: 400 });

  const promo = await prisma.promoCode.findUnique({
    where: { code: code.toUpperCase().trim() },
  });

  if (!promo || !promo.active) {
    return NextResponse.json({ error: "Промокод не найден или неактивен" }, { status: 404 });
  }

  if (promo.expiresAt && promo.expiresAt < new Date()) {
    return NextResponse.json({ error: "Промокод истёк" }, { status: 400 });
  }

  if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) {
    return NextResponse.json({ error: "Промокод использован максимальное количество раз" }, { status: 400 });
  }

  return NextResponse.json({
    valid: true,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    minOrder: promo.minOrder,
    code: promo.code,
  });
}
