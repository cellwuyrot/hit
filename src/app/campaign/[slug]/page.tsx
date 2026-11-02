import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";
const base = process.env.NEXT_PUBLIC_BASE_URL || "https://tophitt.ru";
type Props = { params: Promise<{ slug: string }> };
async function getCampaign(slug: string) {
  return prisma.campaign.findFirst({ where: { slug, published: true }, include: { products: { include: { product: { include: { category: true } } } } } });
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const campaign = await getCampaign((await params).slug);
  if (!campaign) return { title: "Страница не найдена", robots: { index: false, follow: false } };
  const canonical = `${base}/campaign/${campaign.slug}`;
  const title = campaign.metaTitle || campaign.heading;
  const description = campaign.metaDescription || campaign.description.slice(0, 200);
  return { title, description, alternates: { canonical }, robots: { index: campaign.allowIndex, follow: true }, openGraph: { title, description, url: canonical, type: "website", ...(campaign.image ? { images: [campaign.image] } : {}) } };
}
export default async function CampaignPage({ params }: Props) {
  const campaign = await getCampaign((await params).slug);
  if (!campaign) notFound();
  return <><Header /><main className="flex-1 bg-bg-light"><div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
    <nav aria-label="Навигация" className="text-sm text-text-gray mb-6"><Link href="/">Главная</Link> / Подборка</nav>
    <div className="bg-white border border-border rounded-xl p-6 sm:p-10 mb-8"><p className="text-primary text-sm font-semibold mb-3">ПОДБОРКА ТОПХИТ</p><h1 className="text-3xl sm:text-4xl font-bold text-text-dark mb-4">{campaign.heading}</h1>{campaign.description && <p className="text-text-gray max-w-3xl leading-relaxed whitespace-pre-line">{campaign.description}</p>}</div>
    <section aria-label="Товары подборки"><h2 className="text-2xl font-bold mb-5">Товары подборки</h2>{campaign.products.length ? <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">{campaign.products.map(({ product }) => <ProductCard key={product.id} id={product.id} name={product.name} slug={product.slug} price={product.price} oldPrice={product.oldPrice} image={product.image} inStock={product.inStock} categorySlug={product.category.slug} />)}</div> : <p>Товары пока не добавлены.</p>}</section>
  </div></main><Footer /></>;
}
