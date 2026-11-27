import { prisma } from "@/lib/prisma";
import { checkNewsAgentAuth } from "@/lib/news-agent-auth";

export const runtime = "nodejs";

type InventoryId = { id: string; brand: string };

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function readProductIds(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function productSummary(product: {
  id: string;
  slug: string;
  name: string;
  brand: string;
  description: string;
  productType: string;
  tags: string;
  image: string;
  category: { name: string };
}) {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    description: product.description,
    productType: product.productType,
    tags: product.tags,
    category: product.category.name,
    image: product.image,
    url: `/product/${encodeURIComponent(product.slug)}`,
  };
}

export async function GET(request: Request) {
  const authError = checkNewsAgentAuth(request);
  if (authError) return authError;

  const kindParam = new URL(request.url).searchParams.get("kind") || "random";
  if (!["random", "product", "brand"].includes(kindParam)) {
    return Response.json(
      { error: "Параметр kind должен быть random, product или brand." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const inventory: InventoryId[] = await prisma.product.findMany({
    where: { inStock: { gt: 0 } },
    select: { id: true, brand: true },
  });
  if (inventory.length === 0) {
    return Response.json(
      { error: "В каталоге нет товаров в наличии для подготовки новости." },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Avoid repeating source items used by recent agent-created articles.
  const recent = await prisma.news.findMany({
    orderBy: { createdAt: "desc" },
    take: 40,
    select: { sourceProductIds: true },
  });
  const recentlyUsed = new Set(recent.flatMap((item) => readProductIds(item.sourceProductIds)));
  const freshInventory = inventory.filter((item) => !recentlyUsed.has(item.id));
  const pool = freshInventory.length > 0 ? freshInventory : inventory;
  const brands = [...new Set(pool.map((item) => item.brand.trim()).filter(Boolean))];

  let kind = kindParam;
  if (kind === "random") {
    kind = brands.length > 0 && Math.random() < 0.5 ? "brand" : "product";
  }
  if (kind === "brand" && brands.length === 0) kind = "product";

  if (kind === "product") {
    const selected = randomItem(pool);
    const product = await prisma.product.findUnique({
      where: { id: selected.id },
      include: { category: { select: { name: true } } },
    });
    if (!product || product.inStock <= 0) {
      return Response.json(
        { error: "Товар изменился во время выбора. Запросите кандидата ещё раз." },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }
    return Response.json(
      {
        kind: "product",
        brand: product.brand || null,
        productCount: 1,
        products: [productSummary(product)],
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const brand = randomItem(brands);
  const exclusion = freshInventory.length > 0 && recentlyUsed.size > 0
    ? { id: { notIn: [...recentlyUsed] } }
    : {};
  const where = { brand, inStock: { gt: 0 }, ...exclusion };
  const [products, productCount] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { name: "asc" },
      take: 5,
      include: { category: { select: { name: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  if (products.length === 0) {
    return Response.json(
      { error: "Группа товаров изменилась во время выбора. Запросите кандидата ещё раз." },
      { status: 409, headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json(
    {
      kind: "brand",
      brand,
      productCount,
      products: products.map(productSummary),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}