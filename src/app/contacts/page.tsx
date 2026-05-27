import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import { InlinePageTitle, InlinePageContent } from "@/components/InlinePageContent";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Контакты — ТОПХИТ | Телефон, email, адрес",
  description:
    "Контакты интернет-магазина ТОПХИТ: телефон +7 (936) 256-89-50, email zakaz@tophitt.ru, адрес: Москва, ул. Складочная д. 1 стр. 18. Режим работы ПН-ПТ 09:00-18:00.",
  openGraph: {
    title: "Контакты — ТОПХИТ",
    description:
      "Свяжитесь с нами: +7 (936) 256-89-50, zakaz@tophitt.ru. Москва, ул. Складочная д. 1 стр. 18.",
    locale: "ru_RU",
    type: "website",
    url: "https://tophitt.ru/contacts",
  },
  alternates: { canonical: "https://tophitt.ru/contacts" },
};

export default async function ContactsPage() {
  const contactsPage = await prisma.sitePage.findUnique({
    where: { slug: "contacts" },
  });

  return (
    <>
      <Header />
      <main className="flex-1 bg-bg-light">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <Breadcrumbs items={[{ label: "Контакты" }]} />

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
            {contactsPage ? (
              <>
                <InlinePageTitle
                  id={contactsPage.id}
                  title={contactsPage.title || "Контакты"}
                  as="h1"
                  className="text-xl sm:text-2xl md:text-3xl font-bold text-text-dark mb-4 sm:mb-6"
                />
                <InlinePageContent
                  id={contactsPage.id}
                  content={contactsPage.content}
                />
              </>
            ) : (
              <>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-text-dark mb-4 sm:mb-6">
                  Контакты
                </h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <a
                    href="https://yandex.ru/maps/?text=127018+Москва+ул.+Складочная+д.+1+стр.+18"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 bg-bg-white rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-md transition-all"
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-primary"
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
                      <p className="text-xs text-text-gray mb-0.5">Адрес</p>
                      <p className="text-sm text-text-dark font-medium">
                        127018, г. Москва, ул. Складочная д. 1 стр. 18
                      </p>
                    </div>
                  </a>
                  <a
                    href="tel:+79362568950"
                    className="flex items-start gap-3 bg-bg-white rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-md transition-all"
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-text-gray mb-0.5">Телефон</p>
                      <p className="text-sm text-primary font-bold">
                        +7 (936) 256-89-50
                      </p>
                    </div>
                  </a>
                  <a
                    href="mailto:zakaz@tophitt.ru"
                    className="flex items-start gap-3 bg-bg-white rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-md transition-all"
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-text-gray mb-0.5">
                        Розничные заказы
                      </p>
                      <p className="text-sm text-primary font-medium">
                        zakaz@tophitt.ru
                      </p>
                    </div>
                  </a>
                  <a
                    href="mailto:opt@tophitt.ru"
                    className="flex items-start gap-3 bg-bg-white rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-md transition-all"
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-text-gray mb-0.5">
                        Оптовые заказы
                      </p>
                      <p className="text-sm text-primary font-medium">
                        opt@tophitt.ru
                      </p>
                    </div>
                  </a>
                  <a
                    href="mailto:info@tophitt.ru"
                    className="flex items-start gap-3 bg-bg-white rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-md transition-all sm:col-span-2"
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-text-gray mb-0.5">
                        Для поставщиков
                      </p>
                      <p className="text-sm text-primary font-medium">
                        info@tophitt.ru
                      </p>
                    </div>
                  </a>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-xs text-text-gray">
                    ПН-ПТ с 09:00 до 18:00 | СБ-ВС: Выходной
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Map */}
          <div className="rounded-lg overflow-hidden border border-border">
            <iframe
              src="https://yandex.ru/map-widget/v1/?ll=37.5937%2C55.8025&z=16&l=map&pt=37.5937%2C55.8025%2Cpm2rdm"
              width="100%"
              height="300"
              style={{ border: 0 }}
              title="Карта — ТОПХИТ, Москва"
              loading="lazy"
            />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
