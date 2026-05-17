import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { expandSearchQuery, searchFTS5, buildSearchConditions } from "@/lib/smartSearch";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json([]);

  // Expand query with synonyms and transliteration
  const terms = await expandSearchQuery(q);

  // Try FTS5 first for relevance-ranked results
  const ftsIds = searchFTS5(terms, 10);

  let products;
  if (ftsIds.length > 0) {
    // Fetch products by FTS5-matched IDs
    products = await prisma.product.findMany({
      where: { id: { in: ftsIds } },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        image: true,
        inStock: true,
        category: { select: { name: true, slug: true } },
      },
    });
    // Preserve FTS5 ranking order
    const orderMap = new Map(ftsIds.map((id, i) => [id, i]));
    products.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
  } else {
    // Fallback: Prisma contains search with expanded terms
    products = await prisma.product.findMany({
      where: { OR: buildSearchConditions(terms) },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        image: true,
        inStock: true,
        category: { select: { name: true, slug: true } },
      },
      take: 10,
      orderBy: { isFeatured: "desc" },
    });
  }

  return NextResponse.json(products.slice(0, 10));
}
