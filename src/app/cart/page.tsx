"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useState, useEffect, startTransition } from "react";

interface CartProduct {
  id: string;
  name: string;
  price: number;
  image: string;
}

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: CartProduct;
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("userToken");
    startTransition(() => setToken(saved));
  }, []);

  useEffect(() => {
    if (!token) { startTransition(() => setLoading(false)); return; }
    fetch("/api/user/cart", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => startTransition(() => { setItems(data); setLoading(false); }))
      .catch(() => startTransition(() => setLoading(false)));
  }, [token]);

  const updateQty = async (productId: string, quantity: number) => {
    if (!token) return;
    if (quantity < 1) {
      await fetch("/api/user/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId }),
      });
      setItems((prev) => prev.filter((i) => i.productId !== productId));
    } else {
      await fetch("/api/user/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId, quantity }),
      });
      setItems((prev) => prev.map((i) => i.productId === productId ? { ...i, quantity } : i));
    }
  };

  const removeItem = async (productId: string) => {
    if (!token) return;
    await fetch("/api/user/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId }),
    });
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <>
      <Header />
      <main className="flex-1 bg-bg-light">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-text-dark mb-6">Корзина</h1>

          {!token && (
            <div className="bg-bg-white rounded-xl border border-border p-8 text-center">
              <p className="text-text-gray mb-4">Для использования корзины необходимо войти в аккаунт</p>
              <Link href="/account" className="inline-block bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary-dark transition-colors font-medium">
                Войти / Зарегистрироваться
              </Link>
            </div>
          )}

          {token && loading && <p className="text-text-gray text-center py-8">Загрузка...</p>}

          {token && !loading && items.length === 0 && (
            <div className="bg-bg-white rounded-xl border border-border p-8 text-center">
              <p className="text-text-gray mb-4">Корзина пуста</p>
              <Link href="/catalog" className="inline-block bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary-dark transition-colors font-medium">
                Перейти в каталог
              </Link>
            </div>
          )}

          {token && !loading && items.length > 0 && (
            <>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="bg-bg-white rounded-xl border border-border p-3 sm:p-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-bg-light rounded-lg flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">📦</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-text-dark text-sm sm:text-base truncate">{item.product.name}</h3>
                        <p className="text-xs sm:text-sm text-text-gray">{item.product.price.toLocaleString("ru-RU")} ₽ за шт.</p>
                      </div>
                      <button onClick={() => removeItem(item.productId)} className="text-text-gray hover:text-danger transition-colors flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-3 pl-[3.75rem] sm:pl-[5rem]">
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-border flex items-center justify-center hover:bg-bg-light text-sm">−</button>
                        <span className="w-6 sm:w-8 text-center font-medium text-sm">{item.quantity}</span>
                        <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-border flex items-center justify-center hover:bg-bg-light text-sm">+</button>
                      </div>
                      <p className="font-bold text-primary text-sm sm:text-base">{(item.product.price * item.quantity).toLocaleString("ru-RU")} ₽</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 bg-bg-white rounded-xl border border-border p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-text-gray text-sm">Товаров: {items.reduce((s, i) => s + i.quantity, 0)}</p>
                  <p className="text-xl font-bold text-text-dark">Итого: {total.toLocaleString("ru-RU")} ₽</p>
                </div>
                <Link href="/checkout" className="w-full sm:w-auto bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary-dark transition-colors font-medium text-lg text-center">
                  Оформить заказ
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
