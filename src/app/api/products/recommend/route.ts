import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("recommend") || "random";
  const categoriesParam = searchParams.get("categories") || "";
  const excludeIds = searchParams.get("exclude")?.split(",").filter(Boolean) || [];
  const limit = Math.min(Number(searchParams.get("limit") || "1"), 8);

  const where: Record<string, unknown> = { inStock: { gt: 0 } };
  if (excludeIds.length > 0) {
    where.id = { notIn: excludeIds };
  }

  if ((type === "targeted" || type === "cart") && categoriesParam) {
    const categoryIds = categoriesParam.split(",").filter(Boolean);
    if (categoryIds.length > 0) {
      where.categoryId = { in: categoryIds };
    }
  }

  let count = await prisma.product.count({ where });
  if (count === 0 && where.categoryId) {
    delete where.categoryId;
    count = await prisma.product.count({ where });
  }

  if (count === 0) {
    return limit === 1 ? Response.json(null) : Response.json([]);
  }

  if (limit === 1) {
    const skip = Math.floor(Math.random() * count);
    const product = await prisma.product.findFirst({ where, skip, include: { category: true } });
    return Response.json(product);
  }

  const products = await prisma.product.findMany({
    where,
    include: { category: true },
    take: Math.min(limit * 3, count),
    orderBy: { createdAt: "desc" },
  });

  const shuffled = products.sort(() => Math.random() - 0.5).slice(0, limit);
  return Response.json(shuffled);
}
