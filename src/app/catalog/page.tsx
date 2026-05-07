import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import CatalogFilters from "@/components/CatalogFilters";
import MobileFilterDrawer from "@/components/MobileFilterDrawer";
import Pagination, { PER_PAGE } from "@/components/Pagination";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Suspense } from "react";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import { SkeletonProductGrid } from "@/components/Skeleton";


export const revalidate = 60;

export const metadata: Metadata = {
  title: "Каталог товаров — ТОПХИТ | Опт и розница по ценам от производителя",
  description: "Каталог ТОПХИТ — продукты, бытовая химия, товары для дома оптом и в розницу. Скидка 10% при покупке упаковкой. Доставка по Москве и МО, самовывоз со склада.",
  openGraph: {
    title: "Каталог товаров — ТОПХИТ | Опт и розница",
    description: "Продукты, бытовая химия, товары для дома — от 1 штуки или упаковками со скидкой 10%",
    locale: "ru_RU",
    type: "website",
  },
};

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

async function CatalogContent({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const search = searchParams.search?.trim();
  const sort = searchParams.sort || "popular";
  const priceFrom = searchParams.priceFrom ? Number(searchParams.priceFrom) : undefined;
  const priceTo = searchParams.priceTo ? Number(searchParams.priceTo) : undefined;
  const brands = searchParams.brands?.split(",").filter(Boolean);
  const types = searchParams.types?.split(",").filter(Boolean);
  const colors = searchParams.colors?.split(",").filter(Boolean);

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
      { brand: { contains: search } },
    ];
  }
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

  const page = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);
  const skip = (page - 1) * PER_PAGE;

  const [totalCount, rawProducts, allProducts, categories] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, orderBy, include: { category: true }, take: PER_PAGE, skip }),
    prisma.product.findMany({ select: { brand: true, productType: true, color: true, price: true } }),
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: { order: "asc" },
      include: {
        _count: { select: { products: true } },
        children: { orderBy: { order: "asc" }, include: { _count: { select: { products: true } } } },
      },
    }),
  ]);

  const products = sort === "name"
    ? [...rawProducts].sort((a, b) => a.name.localeCompare(b.name, "ru"))
    : rawProducts;

  const allBrands = [...new Set(allProducts.map((p) => p.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ru"));
  const allTypes = [...new Set(allProducts.map((p) => p.productType).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ru"));
  const allColors = [...new Set(allProducts.map((p) => p.color).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ru"));
  const prices = allProducts.map((p) => p.price);
  const minPrice = Math.min(...prices, 0);
  const maxPrice = Math.max(...prices, 10000);

  const totalPages = Math.ceil(totalCount / PER_PAGE);

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
      <div className="hidden lg:block w-72 flex-shrink-0">
        <CatalogFilters
          brands={allBrands}
          productTypes={allTypes}
          colors={allColors}
          minPrice={minPrice}
          maxPrice={maxPrice}
        />

        <div className="mt-4 bg-bg-white rounded-xl border border-border p-5">
          <h3 className="font-bold text-text-dark mb-3">Категории</h3>
          <ul className="space-y-1">
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/catalog/${cat.slug}`}
                  className="text-sm font-medium text-text-dark hover:text-primary transition-colors flex justify-between py-1"
                >
                  <span>{cat.name}</span>
                  <span className="text-text-light">({cat._count.products})</span>
                </Link>
                {cat.children && cat.children.length > 0 && (
                  <ul className="ml-4 mt-1 mb-2 space-y-1 border-l-2 border-border pl-3">
                    {cat.children.map((sub: { id: string; slug: string; name: string; _count: { products: number } }) => (
                      <li key={sub.id}>
                        <Link
                          href={`/catalog/${cat.slug}/${sub.slug}`}
                          className="text-xs text-text-gray hover:text-primary transition-colors flex justify-between py-0.5"
                        >
                          <span>{sub.name}</span>
                          <span className="text-text-light">({sub._count.products})</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2 sm:gap-3">
          <MobileFilterDrawer
            brands={allBrands}
            productTypes={allTypes}
            colors={allColors}
            minPrice={minPrice}
            maxPrice={maxPrice}
          />
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2 sm:gap-3">
          <p className="text-xs sm:text-sm text-text-gray">
            {search ? <span>{"Поиск: \u00AB"}{search}{"\u00BB \u2014 "}</span> : null}
            {"Подобрано: "}
            <strong className="text-text-dark">{totalCount}{" товаров"}</strong>
            {totalPages > 1 ? <span className="text-text-light">{` (стр. ${page} из ${totalPages})`}</span> : null}
          </p>
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <span className="text-text-gray hidden sm:inline">Сортировка:</span>
            <SortLinks current={sort} />
          </div>
        </div>

        {products.length === 0 ? (
          <div className="bg-bg-white rounded-xl border border-border p-8 sm:p-12 text-center">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 text-text-light mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-text-gray text-base sm:text-lg font-medium">Товары не найдены</p>
            <p className="text-text-light text-xs sm:text-sm mt-2 mb-4">Попробуйте изменить параметры фильтра или посмотреть все товары</p>
            <Link href="/catalog" className="inline-block px-6 py-2.5 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors">Все товары</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
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

        <Pagination currentPage={page} totalItems={totalCount} baseParams={searchParams} />
      </div>
    </div>
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
    <div className="flex gap-1.5 sm:gap-2 flex-wrap">
      {sorts.map((s) => (
        <Link
          key={s.key}
          href={`?sort=${s.key}`}
          className={`px-2 sm:px-3 py-1 rounded-md transition-colors text-xs sm:text-sm ${
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

export default async function CatalogPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <Breadcrumbs items={[{ label: "Каталог" }]} />

          <h1 className="text-xl sm:text-2xl font-bold text-text-dark mb-1 sm:mb-2">Каталог товаров ТОПХИТ</h1>
          <p className="text-text-gray text-sm mb-4 sm:mb-6">Покупайте поштучно или упаковками со скидкой 10% — доставка и самовывоз</p>

          <Suspense fallback={<SkeletonProductGrid count={8} />}>
            <CatalogContent searchParams={resolvedParams} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
