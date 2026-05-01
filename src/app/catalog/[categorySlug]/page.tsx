import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import CatalogFilters from "@/components/CatalogFilters";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

async function CategoryContent({
  categorySlug,
  searchParams,
}: {
  categorySlug: string;
  searchParams: Record<string, string | undefined>;
}) {
  const category = await prisma.category.findUnique({
    where: { slug: categorySlug },
    include: { children: { orderBy: { order: "asc" } }, parent: true },
  });
  if (!category) notFound();

  const sort = searchParams.sort || "popular";
  const priceFrom = searchParams.priceFrom ? Number(searchParams.priceFrom) : undefined;
  const priceTo = searchParams.priceTo ? Number(searchParams.priceTo) : undefined;
  const brands = searchParams.brands?.split(",").filter(Boolean);
  const types = searchParams.types?.split(",").filter(Boolean);
  const colors = searchParams.colors?.split(",").filter(Boolean);

  const childIds = category.children.map((c) => c.id);
  const catIds = [category.id, ...childIds];
  const where: Record<string, unknown> = { categoryId: { in: catIds } };
  if (priceFrom !== undefined || priceTo !== undefined) {
    where.price = {};
    if (priceFrom !== undefined) (where.price as Record<string, number>).gte = priceFrom;
    if (priceTo !== undefined) (where.price as Record<string, number>).lte = priceTo;
  }
  if (brands && brands.length > 0) where.brand = { in: brands };
  if (types && types.length > 0) where.productType = { in: types };
  if (colors && colors.length > 0) where.color = { in: colors };

  let orderBy: Record<string, string> = {};
  switch (sort) {
    case "price_asc": orderBy = { price: "asc" }; break;
    case "price_desc": orderBy = { price: "desc" }; break;
    case "name": orderBy = { name: "asc" }; break;
    default: orderBy = { createdAt: "desc" };
  }

  const [products, catProducts] = await Promise.all([
    prisma.product.findMany({ where, orderBy, include: { category: true } }),
    prisma.product.findMany({
      where: { categoryId: { in: catIds } },
      select: { brand: true, productType: true, color: true, price: true },
    }),
  ]);

  const allBrands = [...new Set(catProducts.map((p) => p.brand).filter(Boolean))].sort();
  const allTypes = [...new Set(catProducts.map((p) => p.productType).filter(Boolean))].sort();
  const allColors = [...new Set(catProducts.map((p) => p.color).filter(Boolean))].sort();
  const prices = catProducts.map((p) => p.price);
  const minPrice = Math.min(...prices, 0);
  const maxPrice = Math.max(...prices, 10000);

  return (
    <>
      <nav className="text-sm text-text-gray mb-4">
        <Link href="/" className="hover:text-primary">Главная</Link>
        <span className="mx-2">›</span>
        <Link href="/catalog" className="hover:text-primary">Каталог</Link>
        {category.parent && (
          <>
            <span className="mx-2">›</span>
            <Link href={`/catalog/${category.parent.slug}`} className="hover:text-primary">{category.parent.name}</Link>
          </>
        )}
        <span className="mx-2">›</span>
        <span className="text-text-dark">{category.name}</span>
      </nav>

      <h1 className="text-2xl font-bold text-text-dark mb-6">{category.name}</h1>

      {category.children.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {category.children.map((sub) => (
            <Link key={sub.id} href={`/catalog/${sub.slug}`}
              className="px-4 py-2 bg-bg-white border border-border rounded-lg text-sm text-text-gray hover:text-primary hover:border-primary/30 transition-colors">
              {sub.name}
            </Link>
          ))}
        </div>
      )}

      <div className="flex gap-6">
        <div className="hidden lg:block w-72 flex-shrink-0">
          <CatalogFilters
            brands={allBrands}
            productTypes={allTypes}
            colors={allColors}
            minPrice={minPrice}
            maxPrice={maxPrice}
          />
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <p className="text-sm text-text-gray">
              Подобрано: <strong className="text-text-dark">{products.length} товаров</strong>
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-gray">Сортировка:</span>
              <SortLinks current={sort} />
            </div>
          </div>

          {products.length === 0 ? (
            <div className="bg-bg-white rounded-xl border border-border p-12 text-center">
              <p className="text-text-gray text-lg">Товары не найдены</p>
              <p className="text-text-light text-sm mt-2">Попробуйте изменить параметры фильтра</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  slug={product.slug}
                  price={product.price}
                  oldPrice={product.oldPrice}
                  image={product.image}
                  inStock={product.inStock}
                  categorySlug={product.category.slug}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function SortLinks({ current }: { current: string }) {
  const sorts = [
    { key: "popular", label: "По популярности" },
    { key: "name", label: "По алфавиту" },
    { key: "price_asc", label: "По цене ↑" },
    { key: "price_desc", label: "По цене ↓" },
  ];
  return (
    <div className="flex gap-2 flex-wrap">
      {sorts.map((s) => (
        <Link
          key={s.key}
          href={`?sort=${s.key}`}
          className={`px-3 py-1 rounded-md transition-colors ${
            current === s.key
              ? "bg-primary text-white"
              : "bg-bg-light text-text-gray hover:text-text-dark"
          }`}
        >
          {s.label}
        </Link>
      ))}
    </div>
  );
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { categorySlug } = await params;
  const resolvedParams = await searchParams;

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Suspense fallback={<div className="text-center py-12 text-text-gray">Загрузка...</div>}>
            <CategoryContent categorySlug={categorySlug} searchParams={resolvedParams} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
