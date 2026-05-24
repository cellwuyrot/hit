import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { InlineNewsTitle, InlineNewsContent } from "@/components/InlineNewsContent";
import type { Metadata } from "next";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const news = await prisma.news.findUnique({ where: { slug: decodedSlug } });
  if (!news || !news.published) return {};

  const title = `${news.title} — ТОПХИТ`;
  const description = news.excerpt || news.content.replace(/<[^>]*>/g, "").slice(0, 160).trim();
  const url = `https://tophitt.ru/news/${news.slug}`;

  return {
    title,
    description,
    openGraph: {
      title: news.title,
      description,
      locale: "ru_RU",
      type: "article",
      url,
      publishedTime: news.createdAt.toISOString(),
      modifiedTime: news.updatedAt.toISOString(),
      ...(news.image ? { images: [{ url: news.image, alt: news.title }] } : {}),
    },
    alternates: { canonical: url },
  };
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const news = await prisma.news.findUnique({ where: { slug: decodedSlug } });

  if (!news || !news.published) {
    notFound();
  }

  const plainText = news.content.replace(/<[^>]*>/g, "").trim();
  const wordCount = plainText.split(/\s+/).length;

  const newsArticleLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: news.title,
    description: news.excerpt || plainText.slice(0, 200),
    url: `https://tophitt.ru/news/${news.slug}`,
    datePublished: news.createdAt.toISOString(),
    dateModified: news.updatedAt.toISOString(),
    ...(news.image ? { image: [news.image] } : {}),
    author: {
      "@type": "Organization",
      name: "ТОПХИТ",
      url: "https://tophitt.ru",
    },
    publisher: {
      "@type": "Organization",
      name: "ТОПХИТ",
      url: "https://tophitt.ru",
      logo: {
        "@type": "ImageObject",
        url: "https://tophitt.ru/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://tophitt.ru/news/${news.slug}`,
    },
    wordCount,
    articleSection: "Новости",
    inLanguage: "ru-RU",
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: "https://tophitt.ru/" },
      { "@type": "ListItem", position: 2, name: "Новости", item: "https://tophitt.ru/news" },
      { "@type": "ListItem", position: 3, name: news.title },
    ],
  };

  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <main className="flex-1 bg-bg-light">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Breadcrumbs items={[
            { label: "Новости", href: "/news" },
            { label: news.title },
          ]} />
          <article className="bg-bg-white rounded-xl border border-border p-8">
            {news.image && (
              <div className="w-full h-64 bg-bg-light rounded-lg mb-6 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={news.image} alt={news.title} className="w-full h-full object-cover" />
              </div>
            )}
            <InlineNewsTitle id={news.id} title={news.title} />
            <p className="text-sm text-text-gray mb-6">
              {new Date(news.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <InlineNewsContent id={news.id} content={news.content} />
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
