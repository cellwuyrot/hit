"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, startTransition } from "react";
import { showToast } from "@/components/Toast";

interface CartProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  categoryId?: string;
  brand?: string;
  packSize?: number | null;
}

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  isPack: boolean;
  product: CartProduct;
}

interface RecommendedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  oldPrice?: number | null;
  image: string;
  inStock: number;
  category: { slug: string; name: string };
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState<{ code: string; discountType: string; discountValue: number } | null>(null);
  const [promoError, setPromoError] = useState("");

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

  useEffect(() => {
    if (items.length === 0) { setRecommendations([]); return; }
    const categoryIds = [...new Set(items.map((i) => i.product.categoryId).filter(Boolean))];
    const excludeIds = items.map((i) => i.productId);
    const params = new URLSearchParams();
    params.set("recommend", "cart");
    if (categoryIds.length > 0) params.set("categories", categoryIds.join(","));
    params.set("exclude", excludeIds.join(","));
    params.set("limit", "4");

    fetch(`/api/products/recommend?${params}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => startTransition(() => setRecommendations(Array.isArray(data) ? data : data ? [data] : [])))
      .catch(() => {});
  }, [items]);

  const updateQty = async (productId: string, quantity: number, isPack: boolean) => {
    if (!token) return;
    if (quantity < 1) {
      await fetch("/api/user/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId, isPack }),
      });
      setItems((prev) => prev.filter((i) => !(i.productId === productId && i.isPack === isPack)));
    } else {
      await fetch("/api/user/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId, quantity, isPack }),
      });
      setItems((prev) => prev.map((i) => (i.productId === productId && i.isPack === isPack) ? { ...i, quantity } : i));
    }
  };

  const commitQtyInput = (item: CartItem, input: HTMLInputElement, isPack: boolean) => {
    const currentDisplay = isPack
      ? (item.product.packSize ? Math.round(item.quantity / item.product.packSize) : 1)
      : item.quantity;
    const parsed = parseInt(input.value, 10);
    if (isNaN(parsed) || parsed < 1) {
      input.value = String(currentDisplay);
      return;
    }
    if (parsed === currentDisplay) {
      input.value = String(currentDisplay);
      return;
    }
    if (isPack) {
      const ps = item.product.packSize || item.quantity;
      updateQty(item.productId, parsed * ps, true);
    } else {
      updateQty(item.productId, parsed, false);
    }
  };

  const removeItem = async (productId: string, isPack: boolean) => {
    if (!token) return;
    await fetch("/api/user/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId, isPack }),
    });
    setItems((prev) => prev.filter((i) => !(i.productId === productId && i.isPack === isPack)));
  };

  const getItemPrice = (item: CartItem) => {
    const unitPrice = item.product.price;
    if (item.isPack) return Math.round(unitPrice * item.quantity * 0.9);
    return unitPrice * item.quantity;
  };

  const subtotal = items.reduce((sum, item) => sum + getItemPrice(item), 0);
  const packDiscount = items.filter(i => i.isPack).reduce((sum, item) => sum + Math.round(item.product.price * item.quantity * 0.1), 0);
  const discountAmount = promoDiscount
    ? promoDiscount.discountType === "percent"
      ? Math.round(subtotal * promoDiscount.discountValue / 100)
      : promoDiscount.discountValue
    : 0;
  const total = Math.max(0, subtotal - discountAmount);

  const applyPromo = async () => {
    setPromoError("");
    if (!promoCode.trim()) return;
    try {
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setPromoDiscount({ code: data.code, discountType: data.discountType, discountValue: data.discountValue });
        showToast("Промокод применён!");
      } else {
        setPromoError(data.error || "Недействительный промокод");
        setPromoDiscount(null);
      }
    } catch {
      setPromoError("Ошибка проверки промокода");
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 bg-bg-light">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <h1 className="text-xl sm:text-2xl font-bold text-text-dark mb-4 sm:mb-6">Корзина</h1>

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
                  <div key={item.id} className={`bg-bg-white rounded-xl border ${item.isPack ? "border-green-300" : "border-border"} p-3 sm:p-4`}>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-bg-light rounded-lg flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">📦</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-text-dark text-sm sm:text-base truncate">{item.product.name}</h3>
                        <p className="text-xs sm:text-sm text-text-gray">
                          {item.isPack
                            ? `🟢 ${item.product.packSize ? Math.round(item.quantity / item.product.packSize) : 1} уп. × ${item.product.packSize || item.quantity} шт. = ${item.quantity} шт. — скидка 10%`
                            : `${item.product.price.toLocaleString("ru-RU")} ₽ за шт.`}
                        </p>
                      </div>
                      <button onClick={() => removeItem(item.productId, item.isPack)} className="text-text-gray hover:text-danger transition-colors flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-3 pl-[3.75rem] sm:pl-[5rem]">
                      {item.isPack ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => {
                            const ps = item.product.packSize || item.quantity;
                            updateQty(item.productId, item.quantity - ps, true);
                          }} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-green-300 flex items-center justify-center hover:bg-green-50 text-sm text-green-600">−</button>
                          <input
                            key={`pack-qty-${item.quantity}`}
                            type="number"
                            min={1}
                            inputMode="numeric"
                            defaultValue={item.product.packSize ? Math.round(item.quantity / item.product.packSize) : 1}
                            onBlur={(e) => commitQtyInput(item, e.currentTarget, true)}
                            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                            className="w-12 sm:w-14 h-7 sm:h-8 text-center font-medium text-sm text-green-700 border border-green-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            aria-label="Количество упаковок"
                          />
                          <span className="text-sm font-medium text-green-700">уп.</span>
                          <button onClick={() => {
                            const ps = item.product.packSize || item.quantity;
                            updateQty(item.productId, item.quantity + ps, true);
                          }} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-green-300 flex items-center justify-center hover:bg-green-50 text-sm text-green-600">+</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQty(item.productId, item.quantity - 1, false)} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-border flex items-center justify-center hover:bg-bg-light text-sm">−</button>
                          <input
                            key={`qty-${item.quantity}`}
                            type="number"
                            min={1}
                            inputMode="numeric"
                            defaultValue={item.quantity}
                            onBlur={(e) => commitQtyInput(item, e.currentTarget, false)}
                            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                            className="w-12 sm:w-14 h-7 sm:h-8 text-center font-medium text-sm border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            aria-label="Количество"
                          />
                          <button onClick={() => updateQty(item.productId, item.quantity + 1, false)} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-border flex items-center justify-center hover:bg-bg-light text-sm">+</button>
                        </div>
                      )}
                      <p className={`font-bold text-sm sm:text-base ${item.isPack ? "text-green-600" : "text-primary"}`}>{getItemPrice(item).toLocaleString("ru-RU")} ₽</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Promo code */}
              <div className="mt-4 bg-bg-white rounded-xl border border-border p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Промокод"
                    className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <button onClick={applyPromo} className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors">
                    Применить
                  </button>
                </div>
                {promoError && <p className="text-danger text-xs mt-2">{promoError}</p>}
                {promoDiscount && (
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span className="text-success">Промокод «{promoDiscount.code}» применён</span>
                    <button onClick={() => { setPromoDiscount(null); setPromoCode(""); }} className="text-text-gray hover:text-danger text-xs">Убрать</button>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="mt-4 bg-bg-white rounded-xl border border-border p-4 sm:p-6">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm text-text-gray">
                    <span>Товаров: {items.reduce((s, i) => s + i.quantity, 0)}</span>
                    <span>{(subtotal + packDiscount).toLocaleString("ru-RU")} ₽</span>
                  </div>
                  {packDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Скидка за упаковку (−10%)</span>
                      <span>−{packDiscount.toLocaleString("ru-RU")} ₽</span>
                    </div>
                  )}
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-success">
                      <span>Скидка по промокоду</span>
                      <span>-{discountAmount.toLocaleString("ru-RU")} ₽</span>
                    </div>
                  )}
                  <div className="border-t border-border pt-2 flex justify-between">
                    <span className="text-lg font-bold text-text-dark">Итого</span>
                    <span className="text-lg font-bold text-text-dark">{total.toLocaleString("ru-RU")} ₽</span>
                  </div>
                </div>
                <Link href="/checkout" className="block w-full bg-accent hover:bg-accent-dark text-white px-8 py-3 rounded-lg transition-colors font-medium text-lg text-center">
                  Оформить заказ
                </Link>
              </div>
              {recommendations.length > 0 && (
                <div className="mt-6 sm:mt-8">
                  <h2 className="text-base sm:text-lg font-bold text-text-dark mb-3 sm:mb-4">Вам также может понравиться</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
                    {recommendations.map((rec) => (
                      <Link key={rec.id} href={`/product/${rec.slug}`} className="bg-bg-white rounded-xl border border-border p-3 hover:shadow-lg transition-shadow group">
                        <div className="relative aspect-square mb-2 bg-bg-light rounded-lg flex items-center justify-center overflow-hidden">
                          {rec.image ? (
                            <Image src={rec.image} alt={rec.name} fill className="object-contain p-2 group-hover:scale-105 transition-transform" />
                          ) : (
                            <div className="text-text-light text-2xl">📦</div>
                          )}
                          {rec.oldPrice && (
                            <span className="absolute top-1 left-1 bg-danger text-white text-xs font-bold px-1.5 py-0.5 rounded">
                              -{Math.round(((rec.oldPrice - rec.price) / rec.oldPrice) * 100)}%
                            </span>
                          )}
                        </div>
                        <h3 className="text-xs font-medium text-text-dark line-clamp-2 mb-1 group-hover:text-primary transition-colors">{rec.name}</h3>
                        <p className="text-sm font-bold text-text-dark">{rec.price.toLocaleString("ru-RU")} ₽</p>
                        <p className="text-xs text-text-gray">{rec.category.name}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
