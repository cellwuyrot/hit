import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Страница не найдена — ТОПХИТ",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-bg-light flex items-center justify-center py-16">
        <div className="text-center px-4">
          <div className="text-8xl font-bold text-primary/20 mb-4">404</div>
          <h1 className="text-2xl font-bold text-text-dark mb-3">Страница не найдена</h1>
          <p className="text-text-gray mb-8 max-w-md mx-auto">
            Запрашиваемая страница не существует, была удалена или перемещена.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="bg-primary hover:bg-primary-dark text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm">
              На главную
            </Link>
            <Link href="/catalog" className="bg-bg-white border border-border hover:border-primary text-text-dark font-medium px-6 py-2.5 rounded-lg transition-colors text-sm">
              Каталог товаров
            </Link>
            <Link href="/about" className="bg-bg-white border border-border hover:border-primary text-text-dark font-medium px-6 py-2.5 rounded-lg transition-colors text-sm">
              О компании
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
