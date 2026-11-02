import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSlider from "@/components/HeroSlider";
import ProductCard from "@/components/ProductCard";
import ScrollReveal from "@/components/ScrollReveal";
import CategoryGrid from "@/components/CategoryGrid";
import InlineSetting from "@/components/InlineSetting";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

// Всегда читаем актуальный каталог из текущей базы, а не из сборочной копии.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [slides, categories, featuredProducts, newProducts, saleProducts, wholesaleProducts, reviews] = await Promise.all([
    prisma.sliderImage.findMany({ where: { active: true }, orderBy: { order: "asc" } }),
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: { order: "asc" },
      include: { children: { orderBy: { order: "asc" }, include: { _count: { select: { products: true } } } }, _count: { select: { products: true } } },
    }),
    prisma.product.findMany({
      take: 8,
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      include: { category: true, reviews: { select: { rating: true } } },
    }),
    prisma.product.findMany({
      take: 4,
      where: { createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: "desc" },
      include: { category: true, reviews: { select: { rating: true } } },
    }),
    prisma.product.findMany({
      take: 4,
      where: { oldPrice: { not: null } },
      orderBy: { updatedAt: "desc" },
      include: { category: true, reviews: { select: { rating: true } } },
    }),
    prisma.product.findMany({
      take: 8,
      where: { isWholesale: true },
      orderBy: { createdAt: "desc" },
      include: { category: true, reviews: { select: { rating: true } } },
    }),
    prisma.review.findMany({
      take: 6,
      where: { published: true, rating: { gte: 4 } },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, lastName: true } }, product: { select: { name: true, slug: true } } },
    }),
  ]);

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ТОПХИТ",
    url: "https://tophitt.ru",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://tophitt.ru/catalog?search={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  function getAvgRating(revs: { rating: number }[]) {
    if (revs.length === 0) return 0;
    return Math.round(revs.reduce((s, r) => s + r.rating, 0) / revs.length);
  }

  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }} />
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-4 py-6">
          <div className="home-hero relative overflow-hidden rounded-xl min-h-[390px] md:min-h-[360px] flex items-start md:items-center p-6 sm:p-10 md:p-14">
            <div className="relative z-10 max-w-md">
              <p className="text-primary uppercase tracking-widest text-xs font-bold mb-4">Товары для каждого дня</p>
              <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold text-text-dark leading-tight mb-4">Всё нужное —<br />в одном месте</h1>
              <p className="text-text-gray text-base leading-relaxed mb-6">Товары для дома и бизнеса: выбирайте поштучно или упаковками.</p>
              <div className="flex flex-wrap gap-3"><Link href="/catalog" className="inline-flex items-center min-h-11 bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-lg">Перейти в каталог <span aria-hidden="true" className="ml-3">→</span></Link><Link href="/wholesale" className="inline-flex items-center min-h-11 bg-white/90 text-primary border border-border font-semibold px-6 py-3 rounded-lg">Оптовым клиентам</Link></div>
            </div>
          </div>
        </section>
        {slides.length > 0 && <section className="max-w-7xl mx-auto px-4 pb-5"><HeroSlider slides={slides} /></section>}

        {/* Advantages */}
        <ScrollReveal>
          <section className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
              {[
                { icon: "🚚", key: "home-benefit-1", title: "Доставка и самовывоз", desc: "Подробнее об условиях на сайте" },
                { icon: "🛡️", key: "home-benefit-2", title: "Товары для дома", desc: "Выбор для повседневных задач" },
                { icon: "💬", key: "home-benefit-3", title: "Поддержка покупателей", desc: "Свяжитесь с нами по вопросам заказа" },
                { icon: "↩️", key: "home-benefit-4", title: "Розница и опт", desc: "Покупайте в нужном количестве" },
              ].map((item) => (
                <div key={item.key} className="bg-bg-white rounded-xl border border-border p-3 sm:p-4 flex items-start gap-2.5 sm:gap-3 hover:shadow-md transition-shadow">
                  <span className="text-xl sm:text-2xl flex-shrink-0">{item.icon}</span>
                  <div>
                    <InlineSetting settingKey={`${item.key}-title`} fallback={item.title} as="h3" className="font-heading text-xs sm:text-sm font-bold text-text-dark" />
                    <InlineSetting settingKey={`${item.key}-desc`} fallback={item.desc} as="p" className="text-xs sm:text-sm text-text-gray mt-0.5" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </ScrollReveal>

        {/* Categories */}
        <ScrollReveal>
          <section className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="font-heading text-lg sm:text-2xl font-bold text-text-dark">Категории товаров</h2>
              <Link href="/catalog" className="text-primary hover:underline text-xs sm:text-sm">Все категории →</Link>
            </div>
            <CategoryGrid categories={categories.map(c => ({ id: c.id, name: c.name, slug: c.slug, icon: c.icon, children: c.children.map(ch => ({ id: ch.id, name: ch.name, slug: ch.slug, icon: ch.icon })), _count: c._count }))} />
          </section>
        </ScrollReveal>

        {/* Sale products */}
        {saleProducts.length > 0 && (
          <ScrollReveal>
            <section className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
              <div className="bg-gradient-to-r from-danger/10 to-accent/10 rounded-xl p-4 sm:p-6 border border-danger/20">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl">🔥</span>
                    <h2 className="font-heading text-lg sm:text-2xl font-bold text-text-dark">Акции и скидки</h2>
                  </div>
                  <Link href="/catalog?sort=price_asc" className="text-danger hover:underline text-xs sm:text-sm font-medium">Все акции →</Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
                  {saleProducts.map((product) => (
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
                      rating={getAvgRating(product.reviews)}
                      reviewCount={product.reviews.length}
                    />
                  ))}
                </div>
              </div>
            </section>
          </ScrollReveal>
        )}

        {/* Featured products */}
        <ScrollReveal>
          <section className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="font-heading text-lg sm:text-2xl font-bold text-text-dark">Популярные товары</h2>
              <Link href="/catalog" className="text-primary hover:underline text-xs sm:text-sm">Все товары →</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
              {featuredProducts.map((product) => (
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
                  rating={getAvgRating(product.reviews)}
                  reviewCount={product.reviews.length}
                  isFeatured={product.isFeatured}
                />
              ))}
            </div>
          </section>
        </ScrollReveal>

        {/* Wholesale catalog */}
        {wholesaleProducts.length > 0 && (
          <ScrollReveal>
            <section className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-4 sm:p-6 border border-primary/20">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl">📦</span>
                    <div>
                      <h2 className="font-heading text-lg sm:text-2xl font-bold text-text-dark">Оптовый каталог</h2>
                      <p className="text-text-gray text-xs sm:text-sm mt-0.5">Товары для оптовых клиентов — специальные цены</p>
                    </div>
                  </div>
                  <Link href="/wholesale" className="text-primary hover:underline text-xs sm:text-sm font-medium whitespace-nowrap">Условия опта →</Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
                  {wholesaleProducts.map((product) => (
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
                      rating={getAvgRating(product.reviews)}
                      reviewCount={product.reviews.length}
                    />
                  ))}
                </div>
              </div>
            </section>
          </ScrollReveal>
        )}

        {/* New arrivals */}
        {newProducts.length > 0 && (
          <ScrollReveal>
            <section className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-xl sm:text-2xl">✨</span>
                  <h2 className="font-heading text-lg sm:text-2xl font-bold text-text-dark">Новинки</h2>
                </div>
                <Link href="/catalog?sort=new" className="text-primary hover:underline text-xs sm:text-sm">Все новинки →</Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
                {newProducts.map((product) => (
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
                    rating={getAvgRating(product.reviews)}
                    reviewCount={product.reviews.length}
                    isNew
                  />
                ))}
              </div>
            </section>
          </ScrollReveal>
        )}

        {/* Customer reviews */}
        {reviews.length > 0 && (
          <ScrollReveal>
            <section className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-6 sm:pb-10">
              <h2 className="font-heading text-lg sm:text-2xl font-bold text-text-dark mb-4 sm:mb-6 text-center">Отзывы покупателей</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-bg-white rounded-xl border border-border p-4 sm:p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-bold text-primary">
                        {(review.authorName || review.user?.name || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-dark">{review.authorName || `${review.user?.name || "Покупатель"}${review.user?.lastName?.[0] ? ` ${review.user.lastName[0]}.` : ""}`}</p>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <svg key={s} className={`w-3 h-3 ${s <= review.rating ? "text-accent fill-accent" : "text-gray-200 fill-gray-200"}`} viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    </div>
                    {review.text && <p className="text-sm text-text-gray line-clamp-3 mb-2">{review.text}</p>}
                    <Link href={`/product/${review.product.slug}`} className="text-xs text-primary hover:underline">{review.product.name}</Link>
                  </div>
                ))}
              </div>
            </section>
          </ScrollReveal>
        )}
      </main>
      <Footer />
    </>
  );
}
