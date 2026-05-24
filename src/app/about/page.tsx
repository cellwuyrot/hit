import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import { InlinePageTitle, InlinePageContent } from "@/components/InlinePageContent";


export const revalidate = 60;

export const metadata: Metadata = {
  title: "О компании ТОПХИТ — оптовая и розничная торговля, доставка, контакты",
  description: "ТОПХИТ — торговая компания, продажа товаров оптом и в розницу по лучшим ценам. Условия сотрудничества, график работы, доставка и самовывоз в Москве.",
  openGraph: {
    title: "О компании ТОПХИТ — опт и розница",
    description: "ТОПХИТ — продажа товаров оптом и в розницу. Выгодные цены, доставка по Москве и МО, самовывоз.",
    locale: "ru_RU",
    type: "website",
    url: "https://tophitt.ru/about",
    images: [{ url: "https://tophitt.ru/opengraph-image", width: 1200, height: 630 }],
  },
  alternates: {
    canonical: "https://tophitt.ru/about",
  },
};

export default async function AboutPage() {
  const [aboutPage, deliveryPage, contactsPage] = await Promise.all([
    prisma.sitePage.findUnique({ where: { slug: "about" } }),
    prisma.sitePage.findUnique({ where: { slug: "delivery" } }),
    prisma.sitePage.findUnique({ where: { slug: "contacts" } }),
  ]);

  return (
    <>
      <Header />
      <main className="flex-1 bg-bg-light">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <Breadcrumbs items={[{ label: "О компании" }]} />
          {/* Hero */}
          <div className="bg-bg-white rounded-xl border border-border p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <Image src="/logo.png" alt="ТОПХИТ" width={64} height={64} className="w-12 h-12 sm:w-16 sm:h-16" />
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-text-dark">ТОПХИТ — торговая компания</h1>
                <p className="text-text-gray">Товары оптом и в розницу по ценам от производителя</p>
              </div>
            </div>

            {aboutPage?.content ? (
              <div className="text-text-gray leading-relaxed space-y-4 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: aboutPage.content }} />
            ) : (
              <div className="text-text-gray leading-relaxed space-y-4">
                <p className="text-lg text-text-dark">
                  ТОПХИТ — современная торговая компания, которая быстро развивается и формирует универсальную площадку для покупок. Мы объединяем востребованные товары из разных категорий, чтобы вы могли закрывать повседневные задачи — от личных покупок до обеспечения бизнеса — в одном месте, без лишних поисков и переплат.
                </p>
                <p>
                  Наша цель — создать удобную, прозрачную и выгодную экосистему для покупок. Мы работаем с актуальным ассортиментом, гибко реагируем на спрос и выстраиваем процессы так, чтобы клиент получал не просто товар, а понятный и надёжный сервис. В основе нашей работы — честные цены, оперативность и внимание к деталям. Мы постоянно расширяем ассортимент и выстраиваем партнёрские отношения, предлагая индивидуальные условия сотрудничества.
                </p>
              </div>
            )}
          </div>

          {/* Values */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-bg-white rounded-xl border border-border p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">&#127919;</span>
              </div>
              <h3 className="font-bold text-text-dark mb-2">Наша цель</h3>
              <p className="text-sm text-text-gray">Создать удобную, прозрачную и выгодную экосистему для покупок с актуальным ассортиментом по честным ценам.</p>
            </div>
            <div className="bg-bg-white rounded-xl border border-border p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">&#129309;</span>
              </div>
              <h3 className="font-bold text-text-dark mb-2">Наш подход</h3>
              <p className="text-sm text-text-gray">Гибкость, честность и ориентация на потребности клиента. Оперативность и внимание к деталям.</p>
            </div>
            <div className="bg-bg-white rounded-xl border border-border p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">&#11088;</span>
              </div>
              <h3 className="font-bold text-text-dark mb-2">Наша особенность</h3>
              <p className="text-sm text-text-gray">Регулярное расширение ассортимента и индивидуальные условия сотрудничества для каждого партнёра.</p>
            </div>
          </div>

          {/* About text */}
          <div className="bg-bg-white rounded-xl border border-border p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
            {aboutPage ? (
              <>
                <InlinePageTitle id={aboutPage.id} title={aboutPage.title || "О нас"} />
                <InlinePageContent id={aboutPage.id} content={aboutPage.content || ""} />
              </>
            ) : (
              <>
                <h2 className="text-lg sm:text-xl font-bold text-text-dark mb-3 sm:mb-4">О нас</h2>
                <div className="text-text-gray leading-relaxed space-y-4">
                  <p>Мы уже предлагаем товары в популярных категориях...</p>
                </div>
              </>
            )}
          </div>

          {/* Delivery */}
          <div className="bg-bg-white rounded-xl border border-border p-4 sm:p-6 md:p-8 mb-6 sm:mb-8" id="delivery">
            {deliveryPage ? (
              <InlinePageTitle id={deliveryPage.id} title={deliveryPage.title || "Доставка"} />
            ) : (
              <h2 className="text-lg sm:text-xl font-bold text-text-dark mb-2">Доставка</h2>
            )}
            {deliveryPage?.content ? (
              <InlinePageContent id={deliveryPage.id} content={deliveryPage.content} />
            ) : (
              <>
                <p className="text-text-gray mb-6">Ваши покупки — наша забота. Доставляем товары через проверенных партнёров по всей России.</p>

                <div className="rounded-xl overflow-hidden mb-6 border border-border">
                  <Image src="/delivery-partners.png" alt="Доставка через Яндекс, OZON, СДЭК, Почта России" width={900} height={500} className="w-full h-auto" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
                  <a href="https://market.yandex.ru" target="_blank" rel="noopener noreferrer"
                    className="bg-bg-light hover:bg-primary/5 border border-border hover:border-primary/30 rounded-xl p-4 flex flex-col items-center gap-2 transition-all">
                    <div className="w-12 h-12 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none">
                        <rect width="24" height="24" rx="6" fill="#FC3F1D" />
                        <path d="M13.63 18.71h-2.05V7.87c-.83 0-1.67.17-2.24.68-.63.57-.89 1.37-.89 2.28 0 1.14.44 1.94 1.32 2.84l.36.37-3.08 4.67H4.7l2.74-4.17C6.27 13.2 5.63 11.97 5.63 10.67c0-3.01 2.05-4.99 5.41-4.99h2.59v13.03z" fill="white" />
                      </svg>
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-text-dark text-center">Яндекс Доставка</span>
                    <span className="text-xs text-text-gray text-center">Курьером до двери</span>
                  </a>
                  <a href="https://ozon.ru" target="_blank" rel="noopener noreferrer"
                    className="bg-bg-light hover:bg-primary/5 border border-border hover:border-primary/30 rounded-xl p-4 flex flex-col items-center gap-2 transition-all">
                    <div className="w-12 h-12 flex items-center justify-center">
                      <svg viewBox="0 0 100 32" className="w-16 h-8">
                        <rect width="100" height="32" rx="4" fill="#005BFF" />
                        <text x="50" y="23" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold" fontFamily="Arial, sans-serif">OZON</text>
                      </svg>
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-text-dark text-center">OZON</span>
                    <span className="text-xs text-text-gray text-center">Пункты выдачи</span>
                  </a>
                  <a href="https://cdek.ru" target="_blank" rel="noopener noreferrer"
                    className="bg-bg-light hover:bg-primary/5 border border-border hover:border-primary/30 rounded-xl p-4 flex flex-col items-center gap-2 transition-all">
                    <div className="w-12 h-12 flex items-center justify-center">
                      <svg viewBox="0 0 100 32" className="w-16 h-8">
                        <rect width="100" height="32" rx="4" fill="#00B33C" />
                        <text x="50" y="23" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" fontFamily="Arial, sans-serif">CDEK</text>
                      </svg>
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-text-dark text-center">СДЭК</span>
                    <span className="text-xs text-text-gray text-center">По всей России</span>
                  </a>
                  <a href="https://pochta.ru" target="_blank" rel="noopener noreferrer"
                    className="bg-bg-light hover:bg-primary/5 border border-border hover:border-primary/30 rounded-xl p-4 flex flex-col items-center gap-2 transition-all">
                    <div className="w-12 h-12 flex items-center justify-center">
                      <svg viewBox="0 0 100 32" className="w-16 h-8">
                        <rect width="100" height="32" rx="4" fill="#005BAC" />
                        <text x="50" y="22" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="Arial, sans-serif">ПОЧТА РОССИИ</text>
                      </svg>
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-text-dark text-center">Почта России</span>
                    <span className="text-xs text-text-gray text-center">В любой населённый пункт</span>
                  </a>
                </div>

                <div className="mt-6 bg-bg-light rounded-xl p-4 md:p-5">
                  <h3 className="font-bold text-text-dark mb-3">Условия доставки</h3>
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
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-green-800 mb-1">Доступен самовывоз</h3>
                      <p className="text-sm text-green-700 mb-1">Москва, ул. Складочная, 1, стр. 18</p>
                      <p className="text-sm text-green-700">Пн–Пт с 11:00 до 16:00, выходной — Сб и Вск</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Contacts */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 sm:p-6 md:p-8" id="contacts">
            {contactsPage ? (
              <InlinePageTitle id={contactsPage.id} title={contactsPage.title || "Контакты"} className="text-lg sm:text-xl font-bold text-text-dark mb-4 sm:mb-6" />
            ) : (
              <h2 className="text-lg sm:text-xl font-bold text-text-dark mb-4 sm:mb-6">Контакты</h2>
            )}
            {contactsPage?.content ? (
              <InlinePageContent id={contactsPage.id} content={contactsPage.content} />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <a href="https://yandex.ru/maps/?text=127018+Москва+ул.+Складочная+д.+1+стр.+18" target="_blank" rel="noopener noreferrer"
                    className="flex items-start gap-3 bg-bg-white rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-md transition-all">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-text-gray mb-0.5">Адрес</p>
                      <p className="text-sm text-text-dark font-medium">127018, г. Москва, ул. Складочная д. 1 стр. 18</p>
                    </div>
                  </a>
                  <a href="tel:+79362568950"
                    className="flex items-start gap-3 bg-bg-white rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-md transition-all">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-text-gray mb-0.5">Телефон</p>
                      <p className="text-sm text-primary font-bold">+7 (936) 256-89-50</p>
                    </div>
                  </a>
                  <a href="mailto:zakaz@tophitt.ru"
                    className="flex items-start gap-3 bg-bg-white rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-md transition-all">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-text-gray mb-0.5">Розничные заказы</p>
                      <p className="text-sm text-primary font-medium">zakaz@tophitt.ru</p>
                    </div>
                  </a>
                  <a href="mailto:opt@tophitt.ru"
                    className="flex items-start gap-3 bg-bg-white rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-md transition-all">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-text-gray mb-0.5">Оптовые заказы</p>
                      <p className="text-sm text-primary font-medium">opt@tophitt.ru</p>
                    </div>
                  </a>
                  <a href="mailto:info@tophitt.ru"
                    className="flex items-start gap-3 bg-bg-white rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-md transition-all sm:col-span-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-text-gray mb-0.5">Для поставщиков</p>
                      <p className="text-sm text-primary font-medium">info@tophitt.ru</p>
                    </div>
                  </a>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-xs text-text-gray">ПН-ПТ с 09:00 до 18:00 | СБ-ВС: Выходной</p>
                </div>
              </>
            )}
          </div>
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "Какие товары продаёт ТОПХИТ?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "ТОПХИТ предлагает широкий ассортимент товаров: продукты питания, бытовая химия, товары для дома, электроника, одежда и аксессуары. Ассортимент постоянно расширяется.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Есть ли оптовые продажи?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Да, ТОПХИТ работает как с розничными, так и с оптовыми клиентами. Оптовые заказы предполагают скидки от 5% до 20% в зависимости от объёма. Заявки принимаются на opt@tophitt.ru.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Как осуществляется доставка?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Доставка по Москве и МО, а также по всей России через Яндекс, OZON, СДЭК и Почту России. Доступен самовывоз: Москва, ул. Складочная, 1, стр. 18, Пн-Пт с 11 до 16ч.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Можно ли вернуть товар?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Возврат товара надлежащего качества возможен в течение 14 дней с момента получения. Подробные условия — на странице «Возврат и обмен».",
                  },
                },
              ],
            }),
          }}
        />
      </main>
      <Footer />
    </>
  );
}
