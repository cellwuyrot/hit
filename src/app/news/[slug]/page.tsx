import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NewsDetailPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;

  const news = await prisma.news.findUnique({ where: { slug } });

  if (!news || !news.published) {
    notFound();
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-bg-light">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Link href="/news" className="text-primary hover:underline text-sm mb-4 inline-block">← Все новости</Link>
          <article className="bg-bg-white rounded-xl border border-border p-8">
            {news.image && (
              <div className="w-full h-64 bg-bg-light rounded-lg mb-6 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={news.image} alt={news.title} className="w-full h-full object-cover" />
              </div>
            )}
            <h1 className="text-3xl font-bold text-text-dark mb-2">{news.title}</h1>
            <p className="text-sm text-text-gray mb-6">
              {new Date(news.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <div className="prose prose-sm max-w-none text-text-dark
              [&_a]:text-primary [&_a]:underline [&_a:hover]:text-primary-dark
              [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
              [&_p]:mb-3 [&_li]:mb-1 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-6
              [&_strong]:font-bold [&_em]:italic"
              dangerouslySetInnerHTML={{ __html: news.content }}
            />
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
