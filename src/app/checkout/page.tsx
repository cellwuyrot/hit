"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useState, useEffect, startTransition } from "react";

interface CartProduct { name: string; price: number; image?: string; }
interface CartItem { productId: string; quantity: number; product: CartProduct; }

const steps = [
  { id: 1, label: "Корзина" },
  { id: 2, label: "Доставка" },
  { id: 3, label: "Подтверждение" },
];

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "", comment: "" });
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    const saved = localStorage.getItem("userToken");
    startTransition(() => setToken(saved));
  }, []);

  useEffect(() => {
    if (!token) return;
    fetch("/api/user/cart", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => startTransition(() => setItems(data)));
    fetch("/api/user/profile", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) startTransition(() => setForm((f) => ({ ...f, name: data.name || "", phone: data.phone || "", address: data.address || "" })));
      });
  }, [token]);

  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleSubmit = async () => {
    setError("");
    if (!form.name || !form.phone || !form.address) { setError("Заполните все обязательные поля"); setStep(2); return; }
    setLoading(true);
    const res = await fetch("/api/user/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setOrderId(data.id);
  };

  if (!token) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-bg-light">
          <div className="max-w-md mx-auto px-4 py-10 text-center">
            <p className="text-text-gray mb-4">Для оформления заказа необходимо войти</p>
            <Link href="/account" className="inline-block bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary-dark font-medium">Войти</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

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
              <p className="text-text-gray mb-4">Номер заказа: #{orderId.slice(0, 8)}</p>
              <p className="text-sm text-text-gray mb-6">Мы свяжемся с вами для подтверждения</p>
              <div className="flex gap-3 justify-center">
                <Link href="/account" className="bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary-dark font-medium">Мои заказы</Link>
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
                          <div key={item.productId} className="flex items-center gap-4 p-3 bg-bg-light rounded-lg">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-text-dark">{item.product.name}</p>
                              <p className="text-xs text-text-gray">{item.quantity} шт. × {item.product.price.toLocaleString("ru-RU")} ₽</p>
                            </div>
                            <span className="font-medium text-text-dark">{(item.product.price * item.quantity).toLocaleString("ru-RU")} ₽</span>
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
                    <div>
                      <label className="text-sm text-text-gray mb-1 block">Имя получателя *</label>
                      <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="text-sm text-text-gray mb-1 block">Телефон *</label>
                      <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+7 (___) ___-__-__"
                        className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="text-sm text-text-gray mb-1 block">Адрес доставки *</label>
                      <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                        className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary" rows={3} />
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
                      if (!form.name || !form.phone || !form.address) { setError("Заполните все обязательные поля"); return; }
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
                        <div key={item.productId} className="flex justify-between text-sm text-text-dark py-1">
                          <span>{item.product.name} × {item.quantity}</span>
                          <span>{(item.product.price * item.quantity).toLocaleString("ru-RU")} ₽</span>
                        </div>
                      ))}
                      <button onClick={() => setStep(1)} className="text-primary text-sm hover:underline mt-2">Изменить</button>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button onClick={() => setStep(2)} className="px-6 py-3 border border-border rounded-lg hover:bg-bg-light text-text-dark font-medium">Назад</button>
                    <button onClick={handleSubmit} disabled={loading || items.length === 0}
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
                    <div key={item.productId} className="flex justify-between text-text-gray">
                      <span className="truncate mr-2">{item.product.name} × {item.quantity}</span>
                      <span className="flex-shrink-0">{(item.product.price * item.quantity).toLocaleString("ru-RU")} ₽</span>
                    </div>
                  ))}
                </div>
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
