import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const news = await prisma.news.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <Header />
      <main className="flex-1 bg-bg-light">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-text-dark mb-6">Новости</h1>
          {news.length === 0 && <p className="text-text-gray text-center py-8">Пока нет новостей</p>}
          <div className="space-y-4">
            {news.map((item) => (
              <Link key={item.id} href={`/news/${item.slug}`}
                className="block bg-bg-white rounded-xl border border-border p-6 hover:shadow-lg hover:border-primary/30 transition-all">
                <div className="flex gap-4">
                  {item.image && (
                    <div className="w-24 h-24 bg-bg-light rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-text-dark mb-1 group-hover:text-primary">{item.title}</h2>
                    <p className="text-sm text-text-gray">{new Date(item.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}</p>
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
