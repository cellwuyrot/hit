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
    prisma.category.findMany({ orderBy: { order: "asc" }, include: { _count: { select: { products: true } } } }),
    prisma.product.findMany({ take: 8, orderBy: { createdAt: "desc" }, include: { category: true } }),
  ]);

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero Slider */}
        <section className="max-w-7xl mx-auto px-4 py-6">
          <HeroSlider slides={slides} />
        </section>

        {/* Categories */}
        <section className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-text-dark">Категории товаров</h2>
            <Link href="/catalog" className="text-primary hover:underline text-sm">
              Все категории →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/catalog/${cat.slug}`}
                className="bg-bg-white rounded-xl border border-border p-6 hover:shadow-lg hover:border-primary/30 transition-all text-center group"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                  <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="font-medium text-text-dark group-hover:text-primary transition-colors">{cat.name}</h3>
                <p className="text-sm text-text-gray mt-1">{cat._count.products} товаров</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Popular products */}
        <section className="max-w-7xl mx-auto px-4 py-6 pb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-text-dark">Популярные товары</h2>
            <Link href="/catalog" className="text-primary hover:underline text-sm">
              Все товары →
            </Link>
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
