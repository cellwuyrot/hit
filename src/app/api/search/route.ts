import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json([]);

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: q } },
        { brand: { contains: q } },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      image: true,
      inStock: true,
      category: { select: { name: true, slug: true } },
    },
    take: 6,
    orderBy: { isFeatured: "desc" },
  });

  return NextResponse.json(products);
}
