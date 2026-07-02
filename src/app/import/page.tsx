import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductCard from "@/components/ProductCard";
import ImportInquiryForm from "@/components/ImportInquiryForm";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Импортные товары — ТОПХИТ",
  description:
    "Эксклюзивный раздел импортных товаров ТОПХИТ: оригинальная продукция из-за рубежа, ограниченные поставки и персональный подбор. Оставьте заявку на импортный товар.",
  alternates: { canonical: "https://tophitt.ru/import" },
};

export default async function ImportPage() {
  const products = await prisma.product.findMany({
    where: { isImported: true },
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });

  return (
    <>
      <Header />
      <main className="flex-1 bg-bg-light">
        {/* Exclusive hero banner */}
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-primary text-white">
          <div className="relative max-w-7xl mx-auto px-4 py-12 sm:py-16 md:py-20 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur px-3 py-1 rounded-full text-xs sm:text-sm font-medium mb-4 border border-white/25">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                Эксклюзивный раздел
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3 leading-tight">Импортные товары</h1>
              <p className="text-white/85 text-sm sm:text-base md:text-lg max-w-xl">
                Оригинальная продукция из-за рубежа, ограниченные поставки и товары, которых нет в обычном каталоге. Персональный подбор и доставка под заказ.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
                <a href="#import-catalog" className="bg-white text-indigo-700 px-5 py-2.5 rounded-lg font-medium hover:bg-white/90 transition-colors">Смотреть товары</a>
                <a href="#import-inquiry" className="bg-white/10 border border-white/30 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-white/20 transition-colors">Оставить заявку</a>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="w-40 h-40 sm:w-52 sm:h-52 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                <svg className="w-24 h-24 sm:w-32 sm:h-32 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <Breadcrumbs items={[{ label: "Импортные товары" }]} />

          {/* Advantages */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
            <div className="bg-bg-white rounded-xl border border-indigo-100 p-4 sm:p-5">
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="font-bold text-text-dark mb-1">Оригинальная продукция</h3>
              <p className="text-sm text-text-gray">Только проверенные поставщики и подлинные импортные товары.</p>
            </div>
            <div className="bg-bg-white rounded-xl border border-indigo-100 p-4 sm:p-5">
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M6 6h12a3 3 0 013 3v6a3 3 0 01-3 3H6a3 3 0 01-3-3V9a3 3 0 013-3z" /></svg>
              </div>
              <h3 className="font-bold text-text-dark mb-1">Ограниченные поставки</h3>
              <p className="text-sm text-text-gray">Эксклюзивные позиции в ограниченном количестве.</p>
            </div>
            <div className="bg-bg-white rounded-xl border border-indigo-100 p-4 sm:p-5">
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <h3 className="font-bold text-text-dark mb-1">Персональный подбор</h3>
              <p className="text-sm text-text-gray">Поможем найти и привезти нужный товар под заказ.</p>
            </div>
          </div>

          {/* Products */}
          <div id="import-catalog" className="scroll-mt-24 mb-10">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-text-dark">Каталог импортных товаров</h2>
              <span className="text-sm text-text-gray">{products.length} товаров</span>
            </div>

            {products.length > 0 ? (
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
                    isFeatured={product.isFeatured}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-bg-white rounded-xl border border-border p-8 text-center">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                </div>
                <h3 className="text-lg font-bold text-text-dark mb-2">Скоро здесь появятся товары</h3>
                <p className="text-sm text-text-gray mb-4">Мы наполняем раздел эксклюзивными импортными позициями. Оставьте заявку — подберём товар под ваш запрос.</p>
                <a href="#import-inquiry" className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 font-medium">Оставить заявку</a>
              </div>
            )}
          </div>

          {/* Inquiry + info */}
          <div id="import-inquiry" className="scroll-mt-24 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-indigo-50 to-primary/5 rounded-xl border border-indigo-100 p-5 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-text-dark mb-2">Заявка на импортный товар</h2>
              <p className="text-sm text-text-gray mb-4">Оставьте контакты и опишите, что вы ищете — менеджер по импорту свяжется с вами и подберёт товар.</p>
              <ImportInquiryForm />
            </div>
            <div className="bg-bg-white rounded-xl border border-border p-5 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-text-dark mb-3">Как это работает</h2>
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</span>
                  <div><h4 className="font-medium text-text-dark">Оставляете заявку</h4><p className="text-sm text-text-gray">Опишите товар или выберите позицию из каталога и добавьте в корзину.</p></div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">2</span>
                  <div><h4 className="font-medium text-text-dark">Подтверждаем наличие и цену</h4><p className="text-sm text-text-gray">Менеджер уточнит сроки поставки и итоговую стоимость с учётом доставки.</p></div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">3</span>
                  <div><h4 className="font-medium text-text-dark">Оформляем и доставляем</h4><p className="text-sm text-text-gray">Привозим товар под заказ и доставляем удобным для вас способом.</p></div>
                </li>
              </ol>
              <div className="mt-6 pt-4 border-t border-border">
                <Link href="/catalog" className="text-indigo-600 hover:underline font-medium text-sm">← Вернуться в общий каталог</Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
