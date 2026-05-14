import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import CatalogFilters from "@/components/CatalogFilters";
import Pagination, { PER_PAGE } from "@/components/Pagination";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getCategoryPath } from "@/lib/slugify";


export const revalidate = 60;

async function resolveCategory(slugSegments: string[]) {
  const leafSlug = slugSegments[slugSegments.length - 1];
  const category = await prisma.category.findUnique({
    where: { slug: leafSlug },
    include: { children: { orderBy: { order: "asc" } }, parent: true },
  });
  if (!category) return null;

  if (slugSegments.length === 2) {
    if (!category.parent || category.parent.slug !== slugSegments[0]) return null;
  } else if (slugSegments.length === 1) {
    // ok
  } else {
    return null;
  }
  return category;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await resolveCategory(slug);
  if (!category) return {};
  const canonicalPath = getCategoryPath(category);
  const title = category.metaTitle || `${category.name} — купить в ТОПХИТ`;
  const description = category.metaDescription || `Купить ${category.name} в магазине ТОПХИТ. Широкий ассортимент, выгодные цены, доставка по Москве и МО.`;
  return {
    title,
    description,
    openGraph: { title, description, locale: "ru_RU", type: "website", url: `https://tophitt.ru${canonicalPath}` },
    alternates: { canonical: `https://tophitt.ru${canonicalPath}` },
  };
}

interface PageProps {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

async function CategoryContent({
  slugSegments,
  searchParams,
}: {
  slugSegments: string[];
  searchParams: Record<string, string | undefined>;
}) {
  const category = await resolveCategory(slugSegments);
  if (!category) notFound();

  const categoryPath = getCategoryPath(category);

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

  const page = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);
  const skip = (page - 1) * PER_PAGE;

  const [totalCount, rawProducts, catProducts] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, orderBy, include: { category: { include: { parent: true } } }, take: PER_PAGE, skip }),
    prisma.product.findMany({
      where: { categoryId: { in: catIds } },
      select: { brand: true, productType: true, color: true, price: true },
    }),
  ]);

  const products = sort === "name"
    ? [...rawProducts].sort((a, b) => a.name.localeCompare(b.name, "ru"))
    : rawProducts;

  const allBrands = [...new Set(catProducts.map((p) => p.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ru"));
  const allTypes = [...new Set(catProducts.map((p) => p.productType).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ru"));
  const allColors = [...new Set(catProducts.map((p) => p.color).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ru"));
  const prices = catProducts.map((p) => p.price);
  const minPrice = Math.min(...prices, 0);
  const maxPrice = Math.max(...prices, 10000);

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description: category.metaDescription || `Купить ${category.name} в магазине ТОПХИТ`,
    url: `https://tophitt.ru${categoryPath}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: totalCount,
      itemListElement: products.map((p, i) => ({
        "@type": "ListItem",
        position: skip + i + 1,
        url: `https://tophitt.ru/product/${p.slug}`,
        item: {
          "@type": "Product",
          name: p.name,
          description: p.description || `${p.name}${p.brand ? ` от ${p.brand}` : ""} — купить в ТОПХИТ. ${category.name}.`,
          url: `https://tophitt.ru/product/${p.slug}`,
          image: p.image || undefined,
          brand: { "@type": "Brand", name: p.brand || category.name || "ТОПХИТ" },
          offers: {
            "@type": "Offer",
            priceCurrency: "RUB",
            price: p.price,
            availability: p.inStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition",
            hasMerchantReturnPolicy: {
              "@type": "MerchantReturnPolicy",
              "@id": "https://tophitt.ru/returns#policy",
              applicableCountry: "RU",
              returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
              merchantReturnDays: 14,
              returnMethod: "https://schema.org/ReturnByMail",
              returnFees: "https://schema.org/FreeReturn",
            },
            shippingDetails: {
              "@type": "OfferShippingDetails",
              shippingRate: { "@type": "MonetaryAmount", value: "0", currency: "RUB" },
              shippingDestination: { "@type": "DefinedRegion", addressCountry: "RU" },
              deliveryTime: {
                "@type": "ShippingDeliveryTime",
                handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 3, unitCode: "DAY" },
                transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 7, unitCode: "DAY" },
              },
            },
          },
        },
      })),
    },
  };

  const breadcrumbItems = [
    { label: "Каталог", href: "/catalog" },
    ...(category.parent ? [{ label: category.parent.name, href: `/catalog/${category.parent.slug}` }] : []),
    { label: category.name },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }} />
      <Breadcrumbs items={breadcrumbItems} />

      <h1 className="text-2xl font-bold text-text-dark mb-6">{category.name}</h1>

      {category.seoText && (
        <div className="text-text-gray text-sm leading-relaxed mb-6 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: category.seoText }} />
      )}

      {category.children.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {category.children.map((sub) => (
            <Link key={sub.id} href={`/catalog/${category.slug}/${sub.slug}`}
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
              {"Подобрано: "}
              <strong className="text-text-dark">{totalCount}{" товаров"}</strong>
              {Math.ceil(totalCount / PER_PAGE) > 1 ? <span className="text-text-light">{` (стр. ${page} из ${Math.ceil(totalCount / PER_PAGE)})`}</span> : null}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-gray">Сортировка:</span>
              <SortLinks current={sort} />
            </div>
          </div>

          {products.length === 0 ? (
            <div className="bg-bg-white rounded-xl border border-border p-12 text-center">
              <svg className="w-16 h-16 text-text-light mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-text-gray text-lg font-medium">Товары не найдены</p>
              <p className="text-text-light text-sm mt-2 mb-4">Попробуйте изменить параметры фильтра или посмотреть все товары</p>
              <Link href="/catalog" className="inline-block px-6 py-2.5 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors">Все товары</Link>
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

          <Pagination currentPage={page} totalItems={totalCount} baseParams={searchParams} />
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
  const { slug } = await params;
  const resolvedParams = await searchParams;

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Suspense fallback={<div className="text-center py-12 text-text-gray">Загрузка...</div>}>
            <CategoryContent slugSegments={slug} searchParams={resolvedParams} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
