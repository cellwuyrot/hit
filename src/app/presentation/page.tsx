import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PresentationView, { type PresentationBlockData } from "@/components/PresentationView";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Презентация — ТОПХИТ",
  description:
    "Презентация интернет-магазина ТОПХИТ: о компании, преимущества, цифры и условия сотрудничества. Товары для дома, бизнеса и семьи оптом и в розницу.",
  openGraph: {
    title: "Презентация — ТОПХИТ",
    description: "Кто мы, чем занимаемся и почему нам доверяют тысячи покупателей и партнёров.",
    locale: "ru_RU",
    type: "website",
    url: "https://tophitt.ru/presentation",
  },
  alternates: { canonical: "https://tophitt.ru/presentation" },
};

export default async function PresentationPage() {
  const blocks = (await prisma.presentationBlock.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  })) as PresentationBlockData[];

  return (
    <>
      <Header />
      <main className="flex-1">
        {blocks.length === 0 ? (
          <section className="max-w-2xl mx-auto px-4 py-24 text-center">
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-text-dark mb-3">Презентация в разработке</h1>
            <p className="text-text-gray mb-6">
              Блоки презентации ещё не заполнены. Их можно настроить в админ-панели в разделе «Презентация».
            </p>
            <Link href="/catalog" className="bg-primary hover:bg-primary-dark text-white font-bold px-8 py-3 rounded-xl transition-colors">
              Перейти в каталог
            </Link>
          </section>
        ) : (
          <PresentationView blocks={blocks} />
        )}
      </main>
      <Footer />
    </>
  );
}
