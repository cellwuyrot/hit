import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";


export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Оптовые продажи — ТОПХИТ",
  description: "Оптовые поставки товаров от ТОПХИТ. Специальные условия для юридических лиц и ИП. Доставка по Москве и МО.",
  openGraph: {
    title: "Оптовые продажи — ТОПХИТ",
    description: "Выгодные условия оптовых поставок для бизнеса",
    locale: "ru_RU",
    type: "website",
  },
};

export default async function WholesalePage() {
  const wholesalePage = await prisma.sitePage.findUnique({ where: { slug: "wholesale" } });

  return (
    <>
      <Header />
      <main className="flex-1 bg-bg-light">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Breadcrumbs items={[{ label: "Оптовые продажи" }]} />
          <h1 className="text-2xl md:text-3xl font-bold text-text-dark mb-6">{wholesalePage?.title || "Оптовые продажи"}</h1>

          {wholesalePage?.content ? (
            <div className="bg-bg-white rounded-xl border border-border p-6 md:p-8 mb-8">
              <div className="text-text-gray leading-relaxed space-y-4 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: wholesalePage.content }} />
            </div>
          ) : (
            <>
              {/* Hero banner */}
              <div className="bg-primary rounded-xl p-6 md:p-8 text-white mb-8">
                <h2 className="text-xl md:text-2xl font-bold mb-3">Выгодные условия для бизнеса</h2>
                <p className="text-white/80 text-sm md:text-base">
                  ТОПХИТ предлагает специальные условия для юридических лиц и индивидуальных предпринимателей.
                  Широкий ассортимент товаров по оптовым ценам с доставкой по Москве и МО.
                </p>
              </div>

              {/* For whom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-bg-white rounded-xl border border-border p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-text-dark mb-2">Юридические лица (ООО, АО)</h3>
                  <ul className="space-y-2 text-sm text-text-gray">
                    <li className="flex items-start gap-2"><span className="text-success mt-0.5">&#8226;</span>Работа по договору поставки</li>
                    <li className="flex items-start gap-2"><span className="text-success mt-0.5">&#8226;</span>Оплата по безналичному расчёту</li>
                    <li className="flex items-start gap-2"><span className="text-success mt-0.5">&#8226;</span>Полный пакет документов (счёт-фактура, накладная, УПД)</li>
                    <li className="flex items-start gap-2"><span className="text-success mt-0.5">&#8226;</span>Отсрочка платежа для постоянных клиентов</li>
                    <li className="flex items-start gap-2"><span className="text-success mt-0.5">&#8226;</span>НДС включён в стоимость</li>
                  </ul>
                </div>
                <div className="bg-bg-white rounded-xl border border-border p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-text-dark mb-2">Индивидуальные предприниматели (ИП)</h3>
                  <ul className="space-y-2 text-sm text-text-gray">
                    <li className="flex items-start gap-2"><span className="text-success mt-0.5">&#8226;</span>Упрощённый документооборот</li>
                    <li className="flex items-start gap-2"><span className="text-success mt-0.5">&#8226;</span>Оплата наличными или по расчётному счёту</li>
                    <li className="flex items-start gap-2"><span className="text-success mt-0.5">&#8226;</span>Товарный чек и накладная</li>
                    <li className="flex items-start gap-2"><span className="text-success mt-0.5">&#8226;</span>Минимальная сумма заказа от 10 000 &#8381;</li>
                    <li className="flex items-start gap-2"><span className="text-success mt-0.5">&#8226;</span>Персональный менеджер</li>
                  </ul>
                </div>
              </div>

              {/* Pricing tiers */}
              <div className="bg-bg-white rounded-xl border border-border p-6 mb-8">
                <h2 className="text-xl font-bold text-text-dark mb-4">Оптовые скидки</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-text-gray font-medium">Сумма заказа</th>
                        <th className="text-center py-3 px-4 text-text-gray font-medium">Скидка</th>
                        <th className="text-left py-3 px-4 text-text-gray font-medium">Условия</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-4 text-text-dark font-medium">от 10 000 &#8381;</td>
                        <td className="py-3 px-4 text-center"><span className="bg-success/10 text-success px-3 py-1 rounded-full font-medium">5%</span></td>
                        <td className="py-3 px-4 text-text-gray">Разовый заказ</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-4 text-text-dark font-medium">от 50 000 &#8381;</td>
                        <td className="py-3 px-4 text-center"><span className="bg-success/10 text-success px-3 py-1 rounded-full font-medium">10%</span></td>
                        <td className="py-3 px-4 text-text-gray">Разовый заказ</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-4 text-text-dark font-medium">от 100 000 &#8381;</td>
                        <td className="py-3 px-4 text-center"><span className="bg-success/10 text-success px-3 py-1 rounded-full font-medium">15%</span></td>
                        <td className="py-3 px-4 text-text-gray">Разовый заказ или договор</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-text-dark font-medium">от 500 000 &#8381;</td>
                        <td className="py-3 px-4 text-center"><span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">Индивидуально</span></td>
                        <td className="py-3 px-4 text-text-gray">Долгосрочный договор поставки</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* How to order */}
              <div className="bg-bg-white rounded-xl border border-border p-6 mb-8">
                <h2 className="text-xl font-bold text-text-dark mb-4">Как оформить оптовый заказ</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { step: "1", title: "Заявка", desc: "Отправьте заявку по email или телефону с перечнем товаров" },
                    { step: "2", title: "Расчёт", desc: "Менеджер подготовит коммерческое предложение с оптовыми ценами" },
                    { step: "3", title: "Договор", desc: "Подписание договора поставки (для постоянных клиентов)" },
                    { step: "4", title: "Доставка", desc: "Отгрузка со склада в Москве или доставка транспортной компанией" },
                  ].map((item) => (
                    <div key={item.step} className="text-center">
                      <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">{item.step}</div>
                      <h4 className="font-medium text-text-dark mb-1">{item.title}</h4>
                      <p className="text-xs text-text-gray">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Required docs */}
              <div className="bg-bg-white rounded-xl border border-border p-6 mb-8">
                <h2 className="text-xl font-bold text-text-dark mb-4">Необходимые документы</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-text-dark mb-2">Для ООО / АО:</h3>
                    <ul className="text-sm text-text-gray space-y-1">
                      <li>&#8226; Карточка предприятия (реквизиты)</li>
                      <li>&#8226; Устав (первая и последняя страницы)</li>
                      <li>&#8226; Свидетельство ОГРН / лист записи ЕГРЮЛ</li>
                      <li>&#8226; Свидетельство ИНН</li>
                      <li>&#8226; Доверенность (если подписывает не директор)</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium text-text-dark mb-2">Для ИП:</h3>
                    <ul className="text-sm text-text-gray space-y-1">
                      <li>&#8226; Свидетельство о регистрации ИП / лист записи ЕГРИП</li>
                      <li>&#8226; Свидетельство ИНН</li>
                      <li>&#8226; Паспорт (копия)</li>
                      <li>&#8226; Реквизиты расчётного счёта</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Contact */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
            <h2 className="text-xl font-bold text-text-dark mb-2">Свяжитесь с нами</h2>
            <p className="text-text-gray text-sm mb-4">Оставьте заявку и наш менеджер свяжется с вами в течение рабочего дня</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="tel:+79362568950" className="flex items-center gap-2 text-primary font-bold text-lg hover:underline">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                +7 (936) 256-89-50
              </a>
              <a href="mailto:opt@tophit.store" className="flex items-center gap-2 text-primary font-bold hover:underline">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                opt@tophit.store
              </a>
            </div>
            <div className="mt-4">
              <Link href="/catalog" className="inline-block bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary-dark font-medium">
                Перейти в каталог
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
