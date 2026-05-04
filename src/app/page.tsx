import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSlider from "@/components/HeroSlider";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [slides, categories, products] = await Promise.all([
    prisma.sliderImage.findMany({ where: { active: true }, orderBy: { order: "asc" } }),
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: { order: "asc" },
      include: { children: { orderBy: { order: "asc" } }, _count: { select: { products: true } } },
    }),
    prisma.product.findMany({ take: 8, orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }], include: { category: true } }),
  ]);

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ТОПХИТ",
    url: "https://tophit.store",
    logo: "https://tophit.store/favicon-32x32.png",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+7-936-256-89-50",
      contactType: "customer service",
      areaServed: "RU",
      availableLanguage: "Russian",
    },
    sameAs: [
      "https://t.me/tophit_store",
      "https://vk.com/tophit_market",
      "https://www.ozon.ru/seller/tophit/",
    ],
  };

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ТОПХИТ",
    url: "https://tophit.store",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://tophit.store/catalog?search={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }} />
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-4 py-6">
          <HeroSlider slides={slides} />
        </section>

        <section className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-text-dark">Категории товаров</h2>
            <Link href="/catalog" className="text-primary hover:underline text-sm">Все категории →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/catalog/${cat.slug}`}
                className="bg-bg-white rounded-xl border border-border p-6 hover:shadow-lg hover:border-primary/30 transition-all group">
                <div className="mb-3 flex justify-center">
                  {cat.icon && (cat.icon.startsWith("/") || cat.icon.startsWith("http")) ? (
                    <img src={cat.icon} alt={cat.name} className="w-16 h-16 object-cover rounded-lg" style={{ maxWidth: 256, maxHeight: 256 }} />
                  ) : (
                    <span className="text-3xl">{cat.icon || "📦"}</span>
                  )}
                </div>
                <h3 className="font-medium text-text-dark text-center group-hover:text-primary transition-colors">{cat.name}</h3>
                {cat.children.length > 0 && (
                  <p className="text-xs text-text-gray text-center mt-1">{cat.children.length} подкатегорий</p>
                )}
              </Link>
            ))}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-6 pb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-text-dark">Популярные товары</h2>
            <Link href="/catalog" className="text-primary hover:underline text-sm">Все товары →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        </section>
      </main>
      <Footer />
    </>
  );
}
