import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import CompareButton from "@/components/CompareButton";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug },
    include: { category: { include: { parent: true } } },
  });
  if (!product) notFound();

  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, id: { not: product.id } },
    take: 4,
    include: { category: true },
  });

  return (
    <>
      <Header />
      <main className="flex-1 bg-bg-light">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-text-gray mb-6 flex-wrap">
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
            <Link href={`/catalog/${product.category.slug}`} className="hover:text-primary">{product.category.name}</Link>
            <span>/</span>
            <span className="text-text-dark">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Image */}
            <div className="bg-bg-white rounded-xl border border-border p-4">
              <div className="relative aspect-square">
                {product.image ? (
                  <Image src={product.image} alt={product.name} fill className="object-contain p-4" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-light">
                    <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                {product.oldPrice && (
                  <span className="absolute top-4 left-4 bg-danger text-white text-sm font-bold px-3 py-1 rounded-lg">
                    -{Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%
                  </span>
                )}
              </div>
            </div>

            {/* Info */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-text-dark mb-4">{product.name}</h1>

              {/* Availability */}
              <div className="flex items-center gap-2 mb-4">
                {product.inStock > 0 ? (
                  <span className="text-success text-sm font-medium">В наличии ({product.inStock} шт.)</span>
                ) : (
                  <span className="text-danger text-sm font-medium">Нет в наличии</span>
                )}
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-primary">{product.price.toLocaleString("ru-RU")} ₽</span>
                  {product.oldPrice && (
                    <span className="text-lg text-text-light line-through">{product.oldPrice.toLocaleString("ru-RU")} ₽</span>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-6 text-sm">
                {product.brand && <div className="flex gap-2"><span className="text-text-gray w-28">Бренд:</span><span className="text-text-dark font-medium">{product.brand}</span></div>}
                {product.productType && <div className="flex gap-2"><span className="text-text-gray w-28">Тип:</span><span className="text-text-dark font-medium">{product.productType}</span></div>}
                {product.color && <div className="flex gap-2"><span className="text-text-gray w-28">Цвет:</span><span className="text-text-dark font-medium">{product.color}</span></div>}
                <div className="flex gap-2"><span className="text-text-gray w-28">Категория:</span><Link href={`/catalog/${product.category.slug}`} className="text-primary hover:underline">{product.category.name}</Link></div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <AddToCartButton productId={product.id} inStock={product.inStock} />
                <CompareButton productId={product.id} productName={product.name} />
              </div>

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
      </main>
      <Footer />
    </>
  );
}
