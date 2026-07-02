import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { expandSearchQuery, searchFTS5, buildSearchConditions } from "@/lib/smartSearch";

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
  const imported = searchParams.get("imported");

  const where: Record<string, unknown> = {};

  // Smart search: expand query with synonyms, transliteration, FTS5
  let ftsProductIds: string[] = [];
  if (search) {
    const terms = await expandSearchQuery(search);
    ftsProductIds = searchFTS5(terms, 100);

    if (ftsProductIds.length > 0) {
      where.id = { in: ftsProductIds };
    } else {
      where.OR = buildSearchConditions(terms);
    }
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
  if (imported === "true") {
    where.isImported = true;
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

  // If FTS5 was used and no explicit sort, preserve relevance order
  let products;
  if (ftsProductIds.length > 0 && sort === "popular") {
    const orderMap = new Map(ftsProductIds.map((id, i) => [id, i]));
    products = [...rawProducts].sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999));
  } else if (sort === "popular") {
    // Popularity = number of tracked views of the product page (/product/<slug>)
    // recorded in the PageView analytics table. More clicks -> higher position.
    const paths = rawProducts.map((p) => `/product/${p.slug}`);
    const viewRows = paths.length
      ? await prisma.pageView.groupBy({
          by: ["path"],
          where: { path: { in: paths } },
          _count: { path: true },
        })
      : [];
    const viewMap = new Map(
      viewRows.map((row) => [row.path.replace(/^\/product\//, ""), row._count.path])
    );
    products = [...rawProducts].sort((a, b) => {
      const va = viewMap.get(a.slug) ?? 0;
      const vb = viewMap.get(b.slug) ?? 0;
      if (vb !== va) return vb - va; // more views first
      // tie-break: newer products first
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } else if (sort === "name") {
    products = [...rawProducts].sort((a, b) => a.name.localeCompare(b.name, "ru"));
  } else {
    products = rawProducts;
  }

  return Response.json(products);
}
