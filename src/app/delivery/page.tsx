import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import { InlinePageTitle, InlinePageContent } from "@/components/InlinePageContent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Доставка — ТОПХИТ | Москва и вся Россия",
  description:
    "Информация о доставке и самовывозе товаров ТОПХИТ. Уточните условия у менеджера.",
  openGraph: {
    title: "Доставка — ТОПХИТ",
    description:
      "Информация о доставке и самовывозе товаров ТОПХИТ.",
    locale: "ru_RU",
    type: "website",
    url: "https://tophitt.ru/delivery",
  },
  alternates: { canonical: "https://tophitt.ru/delivery" },
};

export default async function DeliveryPage() {
  const [deliveryPage, terms] = await Promise.all([
    prisma.sitePage.findUnique({ where: { slug: "delivery" } }),
    prisma.sitePage.findUnique({ where: { slug: "delivery_terms" } }),
  ]);

  return (
    <>
      <Header />
      <main className="flex-1 bg-bg-light">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <Breadcrumbs items={[{ label: "Доставка" }]} />

          <div className="bg-bg-white rounded-xl border border-border p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
            {deliveryPage ? (
              <>
                <InlinePageTitle
                  id={deliveryPage.id}
                  title={deliveryPage.title || "Доставка"}
                  as="h1"
                  className="text-xl sm:text-2xl md:text-3xl font-bold text-text-dark mb-4 sm:mb-6"
                />
                <InlinePageContent
                  id={deliveryPage.id}
                  content={deliveryPage.content}
                />
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-text-dark mb-4">Доставка и самовывоз</h1>
                <p className="text-text-gray">Выберите способ получения при оформлении заказа. Стоимость и сроки доставки уточнит менеджер.</p>
              </>
            )}
          </div>
          <section className="bg-white rounded-xl border border-border p-6 mb-8"><h2 className="font-bold text-lg mb-3">Условия доставки</h2><p className="text-text-gray whitespace-pre-wrap">{terms?.content || "Стоимость и сроки доставки уточнит менеджер. Тариф доставки не входит в сумму товаров."}</p></section>
        </div>
      </main>
      <Footer />
    </>
  );
}
