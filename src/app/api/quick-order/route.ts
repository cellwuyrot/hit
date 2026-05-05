import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { name, phone, productId, productName, quantity } = await req.json();

  if (!name || !phone || !productId) {
    return NextResponse.json({ error: "Имя, телефон и товар обязательны" }, { status: 400 });
  }

  const order = await prisma.quickOrder.create({
    data: {
      name,
      phone,
      productId,
      productName: productName || "",
      quantity: quantity || 1,
    },
  });

  return NextResponse.json({ success: true, orderId: order.id });
}
