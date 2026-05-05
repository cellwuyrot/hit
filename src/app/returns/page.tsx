"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { showToast } from "@/components/Toast";

export default function ReturnsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !orderNumber || !reason) {
      showToast("Заполните все поля");
      return;
    }
    setSubmitted(true);
    showToast("Заявка на возврат отправлена!");
  };

  return (
    <>
      <Header />
      <main className="flex-1 bg-bg-light">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-text-dark mb-6">Возврат и обмен товара</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Info */}
            <div className="bg-bg-white rounded-xl border border-border p-5 sm:p-6 space-y-5 text-sm text-text-gray leading-relaxed">
              <section>
                <h2 className="text-base font-bold text-text-dark mb-2">Условия возврата</h2>
                <ul className="list-disc ml-5 space-y-1.5">
                  <li>Возврат товара надлежащего качества возможен в течение <strong className="text-text-dark">14 дней</strong> с момента получения</li>
                  <li>Товар не должен быть в употреблении, сохранены потребительские свойства, товарный вид, пломбы, ярлыки</li>
                  <li>Должен быть сохранён документ, подтверждающий покупку</li>
                </ul>
              </section>

              <section>
                <h2 className="text-base font-bold text-text-dark mb-2">Товары ненадлежащего качества</h2>
                <p>Если вы обнаружили брак или дефект, вы имеете право на:</p>
                <ul className="list-disc ml-5 space-y-1.5 mt-2">
                  <li>Замену на аналогичный товар</li>
                  <li>Замену на другой товар с перерасчётом цены</li>
                  <li>Уменьшение покупной цены</li>
                  <li>Полный возврат денежных средств</li>
                </ul>
              </section>

              <section>
                <h2 className="text-base font-bold text-text-dark mb-2">Сроки возврата средств</h2>
                <ul className="list-disc ml-5 space-y-1.5">
                  <li>При оплате наличными — в течение 3 рабочих дней</li>
                  <li>При оплате картой — в течение 10 рабочих дней</li>
                </ul>
              </section>

              <section>
                <h2 className="text-base font-bold text-text-dark mb-2">Как оформить возврат</h2>
                <ol className="list-decimal ml-5 space-y-1.5">
                  <li>Заполните форму заявки на возврат</li>
                  <li>Дождитесь подтверждения от менеджера</li>
                  <li>Отправьте товар по указанному адресу</li>
                  <li>Получите возврат средств</li>
                </ol>
              </section>

              <div className="bg-bg-light rounded-lg p-4 border border-border">
                <p className="text-xs text-text-gray">По всем вопросам возврата и обмена обращайтесь:</p>
                <p className="mt-1"><a href="tel:+79362568950" className="text-primary hover:underline text-sm font-medium">+7 (936) 256-89-50</a></p>
              </div>
            </div>

            {/* Form */}
            <div className="bg-bg-white rounded-xl border border-border p-5 sm:p-6">
              <h2 className="font-heading text-base font-bold text-text-dark mb-4">Заявка на возврат</h2>

              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-success" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-text-dark mb-2">Заявка отправлена!</h3>
                  <p className="text-sm text-text-gray">Мы свяжемся с вами в ближайшее время для уточнения деталей.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm text-text-dark mb-1">Ваше имя *</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                      className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm text-text-dark mb-1">Email *</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm text-text-dark mb-1">Номер заказа *</label>
                    <input type="text" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)}
                      className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm text-text-dark mb-1">Причина возврата *</label>
                    <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4}
                      className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" />
                  </div>
                  <button type="submit"
                    className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
                    Отправить заявку
                  </button>
                  <p className="text-[10px] text-text-light text-center">
                    Нажимая кнопку, вы соглашаетесь с <a href="/privacy" className="text-primary hover:underline">политикой конфиденциальности</a>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
