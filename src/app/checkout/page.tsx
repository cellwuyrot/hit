"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useState, useEffect, useRef, startTransition } from "react";
import { useCheckoutCart } from "@/components/useCheckoutCart";
import { CONTACT_METHODS, DELIVERY_METHODS, PICKUP_ADDRESS, parseOrderDetails } from "@/lib/order-options";
import { readGuestCart, writeGuestCart } from "@/lib/guest-cart";

const inputClass = "w-full min-h-11 border border-border rounded-lg px-4 py-2.5 bg-white focus:border-primary";
const labelClass = "text-sm font-medium text-text-dark mb-1.5 block";

export default function CheckoutPage() {
  const { items, token, loading: cartLoading, error: cartError, subtotal, discount, total, promoCode: appliedCode, applyPromo, removePromo } = useCheckoutCart();
  const [promoCode, setPromoCode] = useState("");
  const [deliveryTerms, setDeliveryTerms] = useState("Стоимость и условия доставки уточнит менеджер. Тариф доставки не входит в сумму товаров.");
  useEffect(() => { fetch("/api/pages?slug=delivery_terms").then(r => r.ok ? r.json() : null).then(p => { if (p?.content) setDeliveryTerms(p.content); }).catch(() => {}); }, []);
  const [form, setForm] = useState({ name: "", phone: "", address: "", comment: "", email: "", contactMethod: "phone", contactDetails: "", deliveryMethod: "cdek" });
  const isPickup = form.deliveryMethod === "pickup";
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const requestKey = useRef<string | null>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (!token) return;
    fetch("/api/user/profile", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) startTransition(() => setForm(f => ({ ...f, name: data.name || "", phone: data.phone || "", address: data.address || "", email: data.email || "" }))); }).catch(() => {});
  }, [token]);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);

  const handleSubmit = async () => {
    setError("");
    try { parseOrderDetails(form); }
    catch (e) { setError(e instanceof Error ? e.message : "Проверьте данные заказа"); return; }
    setLoading(true);
    try {
      requestKey.current ||= crypto.randomUUID();
      const res = await fetch("/api/user/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": requestKey.current, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ ...form, items: readGuestCart(), promoCode: appliedCode }),
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

  if (orderId) return <><Header /><main className="flex-1 bg-bg-light"><div className="max-w-md mx-auto px-4 py-12 text-center"><div className="bg-white rounded-xl border border-border p-8"><div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-4 text-3xl" aria-hidden="true">✓</div><h1 className="text-2xl font-bold text-text-dark mb-2">Заказ оформлен!</h1><p className="text-text-gray mb-4">Номер заказа: #{orderId}</p><p className="text-sm text-text-gray mb-6">Мы свяжемся с вами для подтверждения</p><div className="flex flex-wrap gap-3 justify-center"><Link href="/account" className="bg-primary text-white px-5 py-3 rounded-lg hover:bg-primary-dark font-medium">{token ? "Мои заказы" : "Зарегистрироваться — по желанию"}</Link><Link href="/catalog" className="border border-border px-5 py-3 rounded-lg hover:bg-bg-light font-medium">В каталог</Link></div></div></div></main><Footer /></>;

  return <><Header /><main className="flex-1 bg-bg-light"><div className="max-w-7xl mx-auto px-4 py-7 sm:py-10">
    <nav aria-label="Навигация по страницам" className="text-sm text-text-gray mb-5"><Link href="/" className="hover:text-primary">Главная</Link> / <Link href="/cart" className="hover:text-primary">Корзина</Link> / Оформление</nav>
    <h1 className="text-3xl sm:text-4xl font-bold text-text-dark mb-2">Оформление заказа</h1>
    <p className="text-text-gray mb-6">Заполните данные и проверьте состав заказа.</p>
    {cartError && <p role="alert" className="text-danger mb-4">{cartError}</p>}
    {cartLoading && <p className="text-text-gray mb-4">Загрузка корзины...</p>}
    {!cartLoading && (items.length === 0 ? <div className="bg-white rounded-xl border border-border p-8 text-center"><p className="text-text-gray mb-4">Корзина пуста</p><Link href="/catalog" className="text-primary font-medium">Перейти в каталог →</Link></div> : <form noValidate onSubmit={e => { e.preventDefault(); void handleSubmit(); }} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)] gap-5 items-start">
      <div className="space-y-4">
        {error && <p role="alert" tabIndex={-1} ref={errorRef} className="bg-red-50 border border-red-200 text-danger rounded-lg p-4">{error}</p>}
        <section className="bg-white rounded-xl border border-border p-5 sm:p-6"><h2 className="text-lg font-bold mb-4">1 &nbsp; Контактные данные</h2><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className={labelClass} htmlFor="checkout-name">Имя получателя *</label><input id="checkout-name" autoComplete="name" maxLength={150} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass} htmlFor="checkout-phone">Телефон *</label><input id="checkout-phone" autoComplete="tel" type="tel" maxLength={40} placeholder="+7 (___) ___-__-__" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass} htmlFor="checkout-contact">Предпочитаемый способ связи *</label><select id="checkout-contact" value={form.contactMethod} onChange={e => setForm({ ...form, contactMethod: e.target.value })} className={inputClass}>{CONTACT_METHODS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>{form.contactMethod === "whatsapp" && <p className="text-sm text-text-gray mt-2">Свяжемся в WhatsApp по указанному телефону.</p>}</div>
          <div><label className={labelClass} htmlFor="checkout-email">{form.contactMethod === "email" ? "Email для связи *" : "Email (необязательно)"}</label><input id="checkout-email" autoComplete="email" maxLength={254} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} /></div>
          {form.contactMethod === "telegram" && <div className="sm:col-span-2"><label className={labelClass} htmlFor="checkout-telegram">Telegram: username или ссылка *</label><input id="checkout-telegram" value={form.contactDetails} maxLength={200} onChange={e => setForm({ ...form, contactDetails: e.target.value })} placeholder="@username или https://t.me/username" className={inputClass} /></div>}
        </div></section>
        <section className="bg-white rounded-xl border border-border p-5 sm:p-6"><h2 className="text-lg font-bold mb-4">2 &nbsp; Доставка</h2><div className="space-y-4">
          <div><label htmlFor="checkout-delivery" className={labelClass}>Выбор доставки *</label><select id="checkout-delivery" value={form.deliveryMethod} onChange={e => setForm({ ...form, deliveryMethod: e.target.value })} className={inputClass}>{DELIVERY_METHODS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
          {isPickup ? <div className="bg-bg-light border border-border rounded-lg p-4 text-sm"><p className="font-semibold">{PICKUP_ADDRESS}</p><p>Пн–Пт с 11:00 до 16:00, выходной — Сб и Вск</p></div> : <><p className="text-sm text-text-gray whitespace-pre-wrap">{deliveryTerms}</p><div><label className={labelClass} htmlFor="checkout-address">Адрес доставки *</label><textarea id="checkout-address" autoComplete="street-address" maxLength={1000} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={inputClass} rows={3} /></div></>}
          <div><label className={labelClass} htmlFor="checkout-comment">Комментарий к заказу (необязательно)</label><textarea id="checkout-comment" maxLength={2000} placeholder="Пожелания к заказу или доставке" value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} className={inputClass} rows={2} /></div>
        </div></section>
      </div>
      <aside className="bg-white rounded-xl border border-border p-5 sm:p-6 lg:sticky lg:top-4"><div className="flex items-center justify-between gap-3 mb-4"><h2 className="text-lg font-bold">Ваш заказ</h2><Link href="/cart" className="text-primary text-sm">Изменить</Link></div><div className="space-y-3 text-sm mb-5">{items.map(item => <div key={item.id} className="flex justify-between gap-3 border-b border-border pb-3"><span>{item.product.name} × {item.quantity}{item.isPack ? " (упаковка)" : ""}</span><strong className="whitespace-nowrap">{item.lineTotal.toLocaleString("ru-RU")} ₽</strong></div>)}</div>
        <div className="mb-5"><label htmlFor="checkout-promo" className={labelClass}>Промокод</label><div className="flex gap-2"><input id="checkout-promo" value={promoCode} onChange={e => setPromoCode(e.target.value)} placeholder="Введите промокод" className="min-w-0 flex-1 border border-border rounded-lg px-3 py-2 text-sm" /><button type="button" disabled={cartLoading || !promoCode.trim()} onClick={() => void applyPromo(promoCode.trim())} className="bg-primary text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50">Применить</button></div>{appliedCode && <button type="button" onClick={() => { void removePromo(); setPromoCode(""); }} className="text-primary text-sm mt-2">Убрать «{appliedCode}»</button>}</div>
        <div className="flex justify-between text-sm mb-3"><span>Сумма товаров:</span><span>{subtotal.toLocaleString("ru-RU")} ₽</span></div>{discount > 0 && <div className="flex justify-between text-sm text-success mb-3"><span>Скидка по промокоду</span><span>−{discount.toLocaleString("ru-RU")} ₽</span></div>}<div className="flex justify-between text-sm text-text-gray mb-3"><span>Доставка</span><span>{isPickup ? "Самовывоз" : "Уточняется"}</span></div><div className="border-t border-border pt-4 flex justify-between font-bold text-lg"><span>Итого за товары:</span><span>{total.toLocaleString("ru-RU")} ₽</span></div><p className="text-xs text-text-gray mt-2">Стоимость доставки не включена в сумму товаров.</p>
        <button type="submit" disabled={loading || cartLoading || items.length === 0} className="w-full min-h-11 mt-5 bg-primary text-white py-3 rounded-lg hover:bg-primary-dark font-semibold disabled:opacity-50">{loading ? "Оформляем..." : "Подтвердить заказ"}</button>
      </aside>
    </form>)}
  </div></main><Footer /></>;
}
