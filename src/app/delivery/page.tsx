import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import { InlinePageTitle, InlinePageContent } from "@/components/InlinePageContent";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Доставка — ТОПХИТ | Москва и вся Россия",
  description:
    "Доставка товаров ТОПХИТ по Москве, МО и всей России. Яндекс Доставка, OZON, СДЭК, Почта России. Бесплатная доставка от 5000₽. Самовывоз со склада.",
  openGraph: {
    title: "Доставка — ТОПХИТ",
    description:
      "Доставляем товары через Яндекс Доставку, OZON, СДЭК и Почту России. Бесплатно от 5000₽.",
    locale: "ru_RU",
    type: "website",
    url: "https://tophitt.ru/delivery",
  },
  alternates: { canonical: "https://tophitt.ru/delivery" },
};

export default async function DeliveryPage() {
  const deliveryPage = await prisma.sitePage.findUnique({
    where: { slug: "delivery" },
  });

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
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-text-dark mb-4 sm:mb-6">
                  Доставка
                </h1>
                <p className="text-text-gray mb-6">
                  Ваши покупки — наша забота. Доставляем товары через
                  проверенных партнёров по всей России.
                </p>

                <div className="rounded-xl overflow-hidden mb-6 border border-border">
                  <Image
                    src="/delivery-partners.png"
                    alt="Доставка через Яндекс, OZON, СДЭК, Почта России"
                    width={900}
                    height={500}
                    className="w-full h-auto"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
                  <a
                    href="https://market.yandex.ru"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-bg-light hover:bg-primary/5 border border-border hover:border-primary/30 rounded-xl p-4 flex flex-col items-center gap-2 transition-all"
                  >
                    <div className="w-12 h-12 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none">
                        <rect width="24" height="24" rx="6" fill="#FC3F1D" />
                        <path
                          d="M13.63 18.71h-2.05V7.87c-.83 0-1.67.17-2.24.68-.63.57-.89 1.37-.89 2.28 0 1.14.44 1.94 1.32 2.84l.36.37-3.08 4.67H4.7l2.74-4.17C6.27 13.2 5.63 11.97 5.63 10.67c0-3.01 2.05-4.99 5.41-4.99h2.59v13.03z"
                          fill="white"
                        />
                      </svg>
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-text-dark text-center">
                      Яндекс Доставка
                    </span>
                    <span className="text-xs text-text-gray text-center">
                      Курьером до двери
                    </span>
                  </a>
                  <a
                    href="https://ozon.ru"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-bg-light hover:bg-primary/5 border border-border hover:border-primary/30 rounded-xl p-4 flex flex-col items-center gap-2 transition-all"
                  >
                    <div className="w-12 h-12 flex items-center justify-center">
                      <svg viewBox="0 0 100 32" className="w-16 h-8">
                        <rect width="100" height="32" rx="4" fill="#005BFF" />
                        <text
                          x="50"
                          y="23"
                          textAnchor="middle"
                          fill="white"
                          fontSize="20"
                          fontWeight="bold"
                          fontFamily="Arial, sans-serif"
                        >
                          OZON
                        </text>
                      </svg>
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-text-dark text-center">
                      OZON
                    </span>
                    <span className="text-xs text-text-gray text-center">
                      Пункты выдачи
                    </span>
                  </a>
                  <a
                    href="https://cdek.ru"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-bg-light hover:bg-primary/5 border border-border hover:border-primary/30 rounded-xl p-4 flex flex-col items-center gap-2 transition-all"
                  >
                    <div className="w-12 h-12 flex items-center justify-center">
                      <svg viewBox="0 0 100 32" className="w-16 h-8">
                        <rect width="100" height="32" rx="4" fill="#00B33C" />
                        <text
                          x="50"
                          y="23"
                          textAnchor="middle"
                          fill="white"
                          fontSize="18"
                          fontWeight="bold"
                          fontFamily="Arial, sans-serif"
                        >
                          CDEK
                        </text>
                      </svg>
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-text-dark text-center">
                      СДЭК
                    </span>
                    <span className="text-xs text-text-gray text-center">
                      По всей России
                    </span>
                  </a>
                  <a
                    href="https://pochta.ru"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-bg-light hover:bg-primary/5 border border-border hover:border-primary/30 rounded-xl p-4 flex flex-col items-center gap-2 transition-all"
                  >
                    <div className="w-12 h-12 flex items-center justify-center">
                      <svg viewBox="0 0 100 32" className="w-16 h-8">
                        <rect width="100" height="32" rx="4" fill="#005BAC" />
                        <text
                          x="50"
                          y="22"
                          textAnchor="middle"
                          fill="white"
                          fontSize="11"
                          fontWeight="bold"
                          fontFamily="Arial, sans-serif"
                        >
                          ПОЧТА РОССИИ
                        </text>
                      </svg>
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-text-dark text-center">
                      Почта России
                    </span>
                    <span className="text-xs text-text-gray text-center">
                      В любой населённый пункт
                    </span>
                  </a>
                </div>

                <div className="mt-6 bg-bg-light rounded-xl p-4 md:p-5">
                  <h3 className="font-bold text-text-dark mb-3">
                    Условия доставки
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-text-gray">
                    <div className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">&#10003;</span>
                      <span>Бесплатная доставка при заказе от 5 000 &#8381;</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">&#10003;</span>
                      <span>Доставка по Москве — от 1 дня</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">&#10003;</span>
                      <span>Доставка по России — от 2 до 7 дней</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">&#10003;</span>
                      <span>Самовывоз из пунктов выдачи партнёров</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 md:p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-green-800 mb-1">
                        Доступен самовывоз
                      </h3>
                      <p className="text-sm text-green-700 mb-1">
                        Москва, ул. Складочная, 1, стр. 18
                      </p>
                      <p className="text-sm text-green-700">
                        Пн–Пт с 11:00 до 16:00, выходной — Сб и Вск
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
