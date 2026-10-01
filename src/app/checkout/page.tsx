"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useState, useEffect, startTransition } from "react";
import { useCheckoutCart } from "@/components/useCheckoutCart";
import { readGuestCart, writeGuestCart } from "@/lib/guest-cart";

const steps = [
  { id: 1, label: "Корзина" },
  { id: 2, label: "Доставка" },
  { id: 3, label: "Подтверждение" },
];

export default function CheckoutPage() {
  const { items, token, loading: cartLoading, error: cartError, subtotal, discount, total, promoCode: appliedCode, applyPromo, removePromo } = useCheckoutCart();
  const [promoCode, setPromoCode] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", address: "", comment: "", email: "" });
  const [isPickup, setIsPickup] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  useEffect(() => {
    if (!token) return;
    fetch("/api/user/profile", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) startTransition(() => setForm((f) => ({ ...f, name: data.name || "", phone: data.phone || "", address: data.address || "", email: data.email || "" })));
      }).catch(() => {});
  }, [token]);

  const handleSubmit = async () => {
    setError("");
    if (!form.name || !form.phone || (!isPickup && !form.address)) { setError("Заполните все обязательные поля"); setStep(2); return; }
    if (!/^[\d\s\+\-\(\)]+$/.test(form.phone) || form.phone.replace(/\D/g, "").length < 10) {
      setError("Телефон должен содержать минимум 10 цифр"); setStep(2); return;
    }
    if (!isPickup && form.address.trim().length < 10) {
      setError("Укажите полный адрес (город, улица, дом)"); setStep(2); return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/user/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ ...form, isPickup, items: readGuestCart(), promoCode: appliedCode }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Не удалось оформить заказ"); return; }
      localStorage.removeItem("promoCode");
      if (!token) writeGuestCart([]);
      window.dispatchEvent(new Event("cart-updated"));
      setOrderId(data.id);
    } catch { setError("Ошибка связи с сервером. Попробуйте ещё раз"); }
    finally { setLoading(false); }
  };

  if (orderId) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-bg-light">
          <div className="max-w-md mx-auto px-4 py-10 text-center">
            <div className="bg-bg-white rounded-xl border border-border p-8">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-text-dark mb-2">Заказ оформлен!</h1>
              <p className="text-text-gray mb-4">Номер заказа: #{orderId}</p>
              <p className="text-sm text-text-gray mb-6">Мы свяжемся с вами для подтверждения</p>
              <div className="flex gap-3 justify-center">
                <Link href="/account" className="bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary-dark font-medium">{token ? "Мои заказы" : "Зарегистрироваться — по желанию"}</Link>
                <Link href="/catalog" className="border border-border px-6 py-2.5 rounded-lg hover:bg-bg-light font-medium text-text-dark">В каталог</Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-bg-light">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <h1 className="text-xl sm:text-2xl font-bold text-text-dark mb-4 sm:mb-6">Оформление заказа</h1>
          {cartError && <p role="alert" className="text-danger mb-4">{cartError}</p>}
          {cartLoading && <p className="text-text-gray mb-4">Загрузка корзины...</p>}

          {/* Steps indicator */}
          <div className="flex items-center justify-center mb-6 sm:mb-8">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <button onClick={() => { if (s.id < step) setStep(s.id); }}
                  className={`flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                    step === s.id ? "bg-primary text-white" : step > s.id ? "bg-success/10 text-success cursor-pointer" : "bg-bg-white text-text-gray border border-border"
                  }`}>
                  {step > s.id ? (
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-current/20 flex items-center justify-center text-[10px] sm:text-xs">{s.id}</span>
                  )}
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{s.id}</span>
                </button>
                {i < steps.length - 1 && <div className={`w-4 sm:w-8 h-0.5 mx-0.5 sm:mx-1 ${step > s.id ? "bg-success" : "bg-border"}`} />}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="md:col-span-2">
              {/* Step 1: Cart review */}
              {step === 1 && (
                <div className="bg-bg-white rounded-xl border border-border p-4 sm:p-6">
                  <h2 className="text-base sm:text-lg font-bold text-text-dark mb-3 sm:mb-4">Проверьте состав заказа</h2>
                  {items.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-text-gray mb-4">Корзина пуста</p>
                      <Link href="/catalog" className="text-primary hover:underline">Перейти в каталог</Link>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {items.map((item) => (
                          <div key={item.id} className="flex items-center gap-4 p-3 bg-bg-light rounded-lg">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-text-dark">{item.product.name}</p>
                              <p className="text-xs text-text-gray">{item.quantity} шт. × {item.product.price.toLocaleString("ru-RU")} ₽</p>
                            </div>
                            <span className="font-medium text-text-dark">{item.lineTotal.toLocaleString("ru-RU")} ₽</span>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => setStep(2)}
                        className="w-full mt-4 bg-primary text-white py-3 rounded-lg hover:bg-primary-dark transition-colors font-medium">
                        Далее — Данные доставки
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Step 2: Delivery info */}
              {step === 2 && (
                <div className="bg-bg-white rounded-xl border border-border p-4 sm:p-6">
                  <h2 className="text-base sm:text-lg font-bold text-text-dark mb-3 sm:mb-4">Данные для доставки</h2>
                  {error && <p className="text-danger text-sm mb-4">{error}</p>}
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <button onClick={() => { setIsPickup(false); setForm({ ...form, address: "" }); }}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${!isPickup ? "bg-primary text-white" : "bg-bg-light text-text-gray border border-border"}`}>
                        Доставка
                      </button>
                      <button onClick={() => { setIsPickup(true); setForm({ ...form, address: "Самовывоз: Москва, ул. Складочная, 1, стр. 18" }); }}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${isPickup ? "bg-green-600 text-white" : "bg-bg-light text-text-gray border border-border"}`}>
                        Самовывоз
                      </button>
                    </div>
                    {isPickup && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                        <p className="font-medium">Москва, ул. Складочная, 1, стр. 18</p>
                        <p>Пн–Пт с 11:00 до 16:00, выходной — Сб и Вск</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm text-text-gray mb-1 block" htmlFor="checkout-name">Имя получателя *</label>
                      <input id="checkout-name" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="text-sm text-text-gray mb-1 block" htmlFor="checkout-phone">Телефон *</label>
                      <input id="checkout-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+7 (___) ___-__-__"
                        className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary" />
                    </div>
                    {!isPickup && (
                    <div>
                      <label className="text-sm text-text-gray mb-1 block" htmlFor="checkout-address">Адрес доставки *</label>
                      <textarea id="checkout-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                        className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary" rows={3} />
                    </div>
                    )}
                    <div>
                      <label className="text-sm text-text-gray mb-1 block" htmlFor="checkout-email">Email (необязательно)</label>
                      <input id="checkout-email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                        className="w-full border border-border rounded-lg px-4 py-2.5" />
                    </div>
                    <div>
                      <label className="text-sm text-text-gray mb-1 block">Комментарий</label>
                      <textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })}
                        className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary" rows={2} />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button onClick={() => setStep(1)} className="px-6 py-3 border border-border rounded-lg hover:bg-bg-light text-text-dark font-medium">Назад</button>
                    <button onClick={() => {
                      setError("");
                      if (!form.name || !form.phone || (!isPickup && !form.address)) { setError("Заполните все обязательные поля"); return; }
                      if (!/^[\d\s\+\-\(\)]+$/.test(form.phone) || form.phone.replace(/\D/g, "").length < 10) { setError("Телефон должен содержать минимум 10 цифр"); return; }
                      if (!isPickup && form.address.trim().length < 10) { setError("Укажите полный адрес (город, улица, дом)"); return; }
                      setStep(3);
                    }} className="flex-1 bg-primary text-white py-3 rounded-lg hover:bg-primary-dark transition-colors font-medium">
                      Далее — Подтверждение
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Confirmation */}
              {step === 3 && (
                <div className="bg-bg-white rounded-xl border border-border p-4 sm:p-6">
                  <h2 className="text-base sm:text-lg font-bold text-text-dark mb-3 sm:mb-4">Подтверждение заказа</h2>
                  {error && <p className="text-danger text-sm mb-4">{error}</p>}
                  <div className="space-y-4">
                    <div className="p-4 bg-bg-light rounded-lg">
                      <h3 className="text-sm font-medium text-text-gray mb-2">Данные получателя</h3>
                      <p className="text-sm text-text-dark">{form.name}</p>
                      <p className="text-sm text-text-dark">{form.phone}</p>
                      <p className="text-sm text-text-dark">{form.address}</p>
                      {form.comment && <p className="text-sm text-text-gray mt-1">Комментарий: {form.comment}</p>}
                      <button onClick={() => setStep(2)} className="text-primary text-sm hover:underline mt-2">Изменить</button>
                    </div>
                    <div className="p-4 bg-bg-light rounded-lg">
                      <h3 className="text-sm font-medium text-text-gray mb-2">Товары ({items.length})</h3>
                      {items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm text-text-dark py-1">
                          <span>{item.product.name} × {item.quantity}</span>
                          <span>{item.lineTotal.toLocaleString("ru-RU")} ₽</span>
                        </div>
                      ))}
                      <button onClick={() => setStep(1)} className="text-primary text-sm hover:underline mt-2">Изменить</button>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button onClick={() => setStep(2)} className="px-6 py-3 border border-border rounded-lg hover:bg-bg-light text-text-dark font-medium">Назад</button>
                    <button onClick={handleSubmit} disabled={loading || cartLoading || items.length === 0}
                      className="flex-1 bg-primary text-white py-3 rounded-lg hover:bg-primary-dark transition-colors font-medium disabled:opacity-50">
                      {loading ? "Оформляем..." : "Подтвердить заказ"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Order summary sidebar */}
            <div>
              <div className="bg-bg-white rounded-xl border border-border p-6 sticky top-4">
                <h2 className="text-lg font-bold text-text-dark mb-4">Ваш заказ</h2>
                <div className="space-y-2 text-sm mb-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-text-gray">
                      <span className="truncate mr-2">{item.product.name} × {item.quantity}</span>
                      <span className="flex-shrink-0">{item.lineTotal.toLocaleString("ru-RU")} ₽</span>
                    </div>
                  ))}
                </div>
                <div className="mb-4">
                  <label htmlFor="checkout-promo" className="block font-medium mb-2">Промокод</label>
                  <div className="flex gap-2">
                    <input id="checkout-promo" value={promoCode} onChange={e => setPromoCode(e.target.value)} placeholder="Введите промокод" className="min-w-0 flex-1 border border-border rounded-lg px-3 py-2 text-sm" />
                    <button disabled={cartLoading || !promoCode.trim()} onClick={() => void applyPromo(promoCode.trim())} className="bg-primary text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50">Применить</button>
                  </div>
                  {appliedCode && <button onClick={() => { void removePromo(); setPromoCode(""); }} className="text-primary text-sm mt-2">Убрать «{appliedCode}»</button>}
                </div>
                <div className="flex justify-between text-sm mb-2"><span>Сумма товаров:</span><span>{subtotal.toLocaleString("ru-RU")} ₽</span></div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 mb-2">
                    <span>Скидка по промокоду</span>
                    <span>−{discount.toLocaleString("ru-RU")} ₽</span>
                  </div>
                )}
                <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
                  <span>Итого:</span>
                  <span className="text-primary">{total.toLocaleString("ru-RU")} ₽</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
