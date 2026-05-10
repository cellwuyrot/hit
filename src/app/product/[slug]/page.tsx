import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import AddToCartButton, { AddPackButton } from "@/components/AddToCartButton";
import CompareButton from "@/components/CompareButton";
import ProductGallery from "@/components/ProductGallery";
import CategoryTracker from "@/components/CategoryTracker";
import ProductReviews from "@/components/ProductReviews";
import QuickOrderButton from "@/components/QuickOrderButton";
import StockAlertButton from "@/components/StockAlertButton";
import ScrollReveal from "@/components/ScrollReveal";
import ProductViewTracker from "@/components/ProductViewTracker";
import RecentlyViewed from "@/components/RecentlyViewed";
import type { Metadata } from "next";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug },
    include: { category: true },
  });
  if (!product) return {};
  const title = `${product.name} — купить в ТОПХИТ`;
  const description = product.description
    ? product.description.slice(0, 160)
    : `${product.name} по цене ${product.price} ₽. ${product.brand ? `Бренд: ${product.brand}.` : ""} Купить в интернет-магазине ТОПХИТ с доставкой.`;
  const keywords = product.tags
    ? product.tags
    : [product.name, product.brand, product.category.name, "купить", "ТОПХИТ"].filter(Boolean).join(", ");
  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "ru_RU",
      url: `https://tophitt.ru/product/${slug}`,
      images: product.image ? [{ url: product.image }] : [],
    },
    alternates: { canonical: `https://tophitt.ru/product/${slug}` },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug },
    include: {
      category: { include: { parent: true } },
      reviews: {
        where: { published: true },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });
  if (!product) notFound();

  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, id: { not: product.id } },
    take: 4,
    include: { category: true },
  });

  const avgRating = product.reviews.length > 0
    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
    : 0;

  const images = [product.image, product.image2, product.image3, product.image4].filter(Boolean);

  const priceValidUntil = new Date();
  priceValidUntil.setFullYear(priceValidUntil.getFullYear() + 1);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.name,
    image: images.length > 0 ? images : undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    sku: product.code || product.id,
    mpn: product.code || undefined,
    gtin13: product.barcode || undefined,
    color: product.color || undefined,
    weight: product.weight ? { "@type": "QuantitativeValue", value: product.weight, unitCode: "KGM" } : undefined,
    category: product.category.name,
    url: `https://tophitt.ru/product/${product.slug}`,
    keywords: product.tags || undefined,
    offers: {
      "@type": "Offer",
      url: `https://tophitt.ru/product/${product.slug}`,
      priceCurrency: "RUB",
      price: product.price,
      priceValidUntil: priceValidUntil.toISOString().split("T")[0],
      availability: product.inStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "ТОПХИТ" },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "RU",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 14,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "RU",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 3, unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 7, unitCode: "DAY" },
        },
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.reviews.length > 0 ? avgRating.toFixed(1) : "5.0",
      reviewCount: product.reviews.length > 0 ? product.reviews.length : 1,
      bestRating: 5,
      worstRating: 1,
    },
    review: product.reviews.length > 0
      ? product.reviews.slice(0, 5).map((r) => ({
          "@type": "Review",
          author: { "@type": "Person", name: r.user.name || r.user.email.split("@")[0] },
          datePublished: r.createdAt.toISOString().split("T")[0],
          reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
          reviewBody: r.text || undefined,
        }))
      : [{
          "@type": "Review",
          author: { "@type": "Organization", name: "ТОПХИТ" },
          datePublished: product.createdAt.toISOString().split("T")[0],
          reviewRating: { "@type": "Rating", ratingValue: 5, bestRating: 5, worstRating: 1 },
          reviewBody: `${product.name} — рекомендуем!`,
        }],
  };

  const breadcrumbItems = [
    { name: "Главная", url: "https://tophitt.ru/" },
    { name: "Каталог", url: "https://tophitt.ru/catalog" },
    ...(product.category.parent ? [{ name: product.category.parent.name, url: `https://tophitt.ru/catalog/${product.category.parent.slug}` }] : []),
    { name: product.category.name, url: product.category.parent ? `https://tophitt.ru/catalog/${product.category.parent.slug}/${product.category.slug}` : `https://tophitt.ru/catalog/${product.category.slug}` },
    { name: product.name },
  ];

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...("url" in item ? { item: item.url } : {}),
    })),
  };

  return (
    <>
      <Header />
      <CategoryTracker categoryId={product.categoryId} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <ProductViewTracker id={product.id} name={product.name} slug={product.slug} price={product.price} image={product.image} />
      <main className="flex-1 bg-bg-light">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-text-gray mb-4 sm:mb-6 flex-wrap">
            <Link href="/" className="hover:text-primary">Главная</Link>
            <span>/</span>
            <Link href="/catalog" className="hover:text-primary">Каталог</Link>
            <span>/</span>
            {product.category.parent && (
              <>
                <Link href={`/catalog/${product.category.parent.slug}`} className="hover:text-primary">{product.category.parent.name}</Link>
                <span>/</span>
              </>
            )}
            <Link href={product.category.parent ? `/catalog/${product.category.parent.slug}/${product.category.slug}` : `/catalog/${product.category.slug}`} className="hover:text-primary">{product.category.name}</Link>
            <span>/</span>
            <span className="text-text-dark">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
            {/* Image Gallery */}
            <ProductGallery
              images={[product.image, product.image2, product.image3, product.image4].filter(Boolean)}
              name={product.name}
              discount={product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0}
            />

            {/* Info */}
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-text-dark mb-3 sm:mb-4">{product.name}</h1>

              {/* Availability */}
              <div className="flex items-center gap-2 mb-4">
                {product.inStock > 0 ? (
                  <span className="text-success text-sm font-medium">В наличии ({product.inStock} шт.)</span>
                ) : (
                  <div className="space-y-2">
                    <span className="text-danger text-sm font-medium block">Нет в наличии</span>
                    <StockAlertButton productId={product.id} />
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="mb-4 sm:mb-6">
                <div className="flex items-baseline gap-2 sm:gap-3">
                  <span className="text-2xl sm:text-3xl font-bold text-primary">{product.price.toLocaleString("ru-RU")} ₽</span>
                  {product.oldPrice && (
                    <span className="text-sm sm:text-lg text-text-light line-through">{product.oldPrice.toLocaleString("ru-RU")} ₽</span>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4 sm:mb-6 text-xs sm:text-sm">
                {product.brand && <div className="flex gap-2"><span className="text-text-gray w-20 sm:w-28 flex-shrink-0">Бренд:</span><span className="text-text-dark font-medium">{product.brand}</span></div>}
                {product.productType && <div className="flex gap-2"><span className="text-text-gray w-20 sm:w-28 flex-shrink-0">Тип:</span><span className="text-text-dark font-medium">{product.productType}</span></div>}
                {product.color && <div className="flex gap-2"><span className="text-text-gray w-20 sm:w-28 flex-shrink-0">Цвет:</span><span className="text-text-dark font-medium">{product.color}</span></div>}
                {product.packSize && <div className="flex gap-2"><span className="text-text-gray w-20 sm:w-28 flex-shrink-0">В упаковке:</span><span className="text-text-dark font-medium">{product.packSize} шт.</span></div>}
                {product.expirationDate && <div className="flex gap-2"><span className="text-text-gray w-20 sm:w-28 flex-shrink-0">Годен до:</span><span className="text-text-dark font-medium">{product.expirationDate}</span></div>}
                <div className="flex gap-2"><span className="text-text-gray w-20 sm:w-28 flex-shrink-0">Категория:</span><Link href={product.category.parent ? `/catalog/${product.category.parent.slug}/${product.category.slug}` : `/catalog/${product.category.slug}`} className="text-primary hover:underline">{product.category.name}</Link></div>
              </div>

              {/* Actions */}
              <div className="space-y-2 mb-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <AddToCartButton productId={product.id} inStock={product.inStock} />
                  <CompareButton productId={product.id} productName={product.name} />
                </div>
                {product.packSize && product.packSize > 1 && (
                  <AddPackButton productId={product.id} inStock={product.inStock} packSize={product.packSize} price={product.price} />
                )}
              </div>

              {/* Quick order */}
              {product.inStock > 0 && (
                <div className="mb-4">
                  <QuickOrderButton productId={product.id} productName={product.name} />
                </div>
              )}

              {/* Wholesale */}
              <Link href={`/wholesale?product=${encodeURIComponent(product.name)}`}
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-6">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Купить оптом
              </Link>

              {/* Description */}
              {product.description && (
                <div className="border-t border-border pt-6">
                  <h2 className="text-lg font-bold text-text-dark mb-3">Описание</h2>
                  <div className="text-text-gray leading-relaxed whitespace-pre-line">{product.description}</div>
                </div>
              )}
            </div>
          </div>

          {/* Reviews */}
          <ProductReviews
            productId={product.id}
            reviews={product.reviews.map((r) => ({
              id: r.id,
              rating: r.rating,
              text: r.text,
              createdAt: r.createdAt.toISOString(),
              userName: r.user.name || r.user.email.split("@")[0],
            }))}
            avgRating={avgRating}
          />

          {/* Related */}
          {related.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold text-text-dark mb-4">Похожие товары</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {related.map((p) => (
                  <Link key={p.id} href={`/product/${p.slug}`}
                    className="bg-bg-white rounded-xl border border-border p-4 hover:shadow-lg transition-shadow">
                    <div className="relative aspect-square mb-3 bg-bg-light rounded-lg flex items-center justify-center overflow-hidden">
                      {p.image ? (
                        <Image src={p.image} alt={p.name} fill className="object-contain p-2" />
                      ) : (
                        <span className="text-text-light text-2xl">📦</span>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-text-dark line-clamp-2 mb-2">{p.name}</h3>
                    <span className="font-bold text-primary">{p.price.toLocaleString("ru-RU")} ₽</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <RecentlyViewed />
      </main>
      <Footer />
    </>
  );
}
