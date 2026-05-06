import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const id = searchParams.get("id");
  if (id) {
    const product = await prisma.product.findUnique({ where: { id }, include: { category: true } });
    if (!product) return Response.json(null, { status: 404 });
    return Response.json(product);
  }

  const search = searchParams.get("search")?.trim();
  const categorySlug = searchParams.get("category");
  const sort = searchParams.get("sort") || "popular";
  const priceFrom = searchParams.get("priceFrom");
  const priceTo = searchParams.get("priceTo");
  const brands = searchParams.get("brands")?.split(",").filter(Boolean);
  const types = searchParams.get("types")?.split(",").filter(Boolean);
  const colors = searchParams.get("colors")?.split(",").filter(Boolean);

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
      { brand: { contains: search } },
    ];
  }

  if (categorySlug) {
    const cat = await prisma.category.findUnique({
      where: { slug: categorySlug },
      include: { children: true },
    });
    if (cat) {
      const childIds = cat.children.map((c) => c.id);
      if (childIds.length > 0) {
        where.categoryId = { in: [cat.id, ...childIds] };
      } else {
        where.category = { slug: categorySlug };
      }
    }
  }
  if (priceFrom || priceTo) {
    where.price = {};
    if (priceFrom) (where.price as Record<string, number>).gte = Number(priceFrom);
    if (priceTo) (where.price as Record<string, number>).lte = Number(priceTo);
  }
  if (brands && brands.length > 0) {
    where.brand = { in: brands };
  }
  if (types && types.length > 0) {
    where.productType = { in: types };
  }
  if (colors && colors.length > 0) {
    where.color = { in: colors };
  }

  let orderBy: Record<string, string> = {};
  switch (sort) {
    case "price_asc":
      orderBy = { price: "asc" };
      break;
    case "price_desc":
      orderBy = { price: "desc" };
      break;
    case "name":
      orderBy = { name: "asc" };
      break;
    default:
      orderBy = { createdAt: "desc" };
  }

  const rawProducts = await prisma.product.findMany({
    where,
    orderBy,
    include: { category: true },
  });

  const products = sort === "name"
    ? [...rawProducts].sort((a, b) => a.name.localeCompare(b.name, "ru"))
    : rawProducts;

  return Response.json(products);
}
