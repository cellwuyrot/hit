import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import NewsFilter from "@/components/NewsFilter";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";


export const revalidate = 60;

export const metadata: Metadata = {
  title: "Новости — ТОПХИТ",
  description: "Новости ТОПХИТ: новые поставки, акции, специальные предложения для оптовых и розничных покупателей. Статьи о товарах и обновления ассортимента.",
  openGraph: {
    title: "Новости — ТОПХИТ",
    description: "Новости и обновления магазина ТОПХИТ",
    locale: "ru_RU",
    type: "website",
    url: "https://tophitt.ru/news",
  },
  alternates: { canonical: "https://tophitt.ru/news" },
};

export default async function NewsPage(props: { searchParams: Promise<{ type?: string }> }) {
  const searchParams = await props.searchParams;
  const typeFilter = searchParams.type;

  const news = await prisma.news.findMany({
    where: {
      published: true,
      ...(typeFilter && typeFilter !== "all" ? { type: typeFilter } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const typeLabels: Record<string, string> = { delivery: "Поставка", article: "Статья" };

  return (
    <>
      <Header />
      <main className="flex-1 bg-bg-light">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <Breadcrumbs items={[{ label: "Новости" }]} />
          <h1 className="text-xl sm:text-2xl font-bold text-text-dark mb-4 sm:mb-6">Новости</h1>

          <NewsFilter activeType={typeFilter || "all"} />

          {news.length === 0 && <p className="text-text-gray text-center py-8">Пока нет новостей в этом разделе</p>}
          <div className="space-y-4">
            {news.map((item) => (
              <Link key={item.id} href={`/news/${item.slug}`}
                className="block bg-bg-white rounded-xl border border-border p-4 sm:p-6 hover:shadow-lg hover:border-primary/30 transition-all">
                <div className="flex gap-4">
                  {item.image && (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-bg-light rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.type === "delivery" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"}`}>
                        {typeLabels[item.type] || "Статья"}
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-text-dark mb-1">{item.title}</h2>
                    {item.excerpt && <p className="text-sm text-text-gray mb-1 line-clamp-2">{item.excerpt}</p>}
                    <p className="text-xs sm:text-sm text-text-gray">{new Date(item.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
