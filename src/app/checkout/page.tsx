"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useState, useEffect, startTransition } from "react";

interface CartProduct { name: string; price: number; }
interface CartItem { productId: string; quantity: number; product: CartProduct; }

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "", comment: "" });
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);

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
    if (!form.name || !form.phone || !form.address) { setError("Заполните все обязательные поля"); return; }
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
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-text-dark mb-6">Оформление заказа</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-bg-white rounded-xl border border-border p-6">
              <h2 className="text-lg font-bold text-text-dark mb-4">Данные для доставки</h2>
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
            </div>
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
                <button onClick={handleSubmit} disabled={loading || items.length === 0}
                  className="w-full mt-4 bg-primary text-white py-3 rounded-lg hover:bg-primary-dark transition-colors font-medium disabled:opacity-50">
                  {loading ? "Оформляем..." : "Подтвердить заказ"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
