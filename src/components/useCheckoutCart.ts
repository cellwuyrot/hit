"use client";
import { useCallback, useEffect, useState, useRef, startTransition } from "react";
import { readGuestCart, setGuestQuantity, writeGuestCart } from "@/lib/guest-cart";

export interface CheckoutCartItem {
  id: string; productId: string; quantity: number; isPack: boolean; lineTotal: number;
  product: { id: string; name: string; price: number; image: string; categoryId: string; packSize: number | null };
}
interface Quote { items: CheckoutCartItem[]; subtotal: number; discount: number; total: number; promoCode: string }
const empty: Quote = { items: [], subtotal: 0, discount: 0, total: 0, promoCode: "" };
export function useCheckoutCart() {
  const [quote, setQuote] = useState<Quote>(empty);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestId = useRef(0);
  const headers = () => {
    const saved = localStorage.getItem("userToken");
    return { "Content-Type": "application/json", ...(saved ? { Authorization: `Bearer ${saved}` } : {}) };
  };
  const refresh = useCallback(async (code?: string, explicit = false) => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError("");
    const promoCode = code ?? localStorage.getItem("promoCode") ?? "";
    try {
      const res = await fetch("/api/checkout/quote", { method: "POST", headers: headers(), body: JSON.stringify({ items: readGuestCart(), promoCode }) });
      const data = await res.json();
      if (currentRequest !== requestId.current) return false;
      if (!res.ok) {
        setError(data.error || "Не удалось загрузить корзину");
        // Просроченный промокод не мешает увидеть корзину, но не применяется.
        if (promoCode) {
          localStorage.removeItem("promoCode");
          const fallback = await fetch("/api/checkout/quote", { method: "POST", headers: headers(), body: JSON.stringify({ items: readGuestCart() }) });
          const fallbackData = await fallback.json();
          if (currentRequest !== requestId.current) return false;
          if (fallback.ok) setQuote(fallbackData);
          else setQuote(empty);
        }
        return false;
      }
      setQuote(data);
      if (explicit) {
        if (data.promoCode) localStorage.setItem("promoCode", data.promoCode);
        else localStorage.removeItem("promoCode");
      }
      return true;
    } catch { if (currentRequest === requestId.current) setError("Не удалось связаться с сервером"); return false; }
    finally { if (currentRequest === requestId.current) setLoading(false); }
  }, []);
  useEffect(() => {
    startTransition(() => { setToken(localStorage.getItem("userToken")); void refresh(); });
  }, [refresh]);
  const updateQty = async (productId: string, quantity: number, isPack: boolean) => {
    try {
      if (!Number.isInteger(quantity) || quantity > 10_000) throw new Error("Некорректное количество");
      const saved = localStorage.getItem("userToken");
      if (!saved) setGuestQuantity(productId, quantity, isPack);
      else {
        const res = await fetch("/api/user/cart", { method: quantity < 1 ? "DELETE" : "PUT", headers: headers(), body: JSON.stringify({ productId, quantity, isPack }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Не удалось изменить корзину");
        window.dispatchEvent(new Event("cart-updated"));
      }
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка корзины"); }
  };
  const clearCart = async () => {
    try {
      const saved = localStorage.getItem("userToken");
      if (!saved) writeGuestCart([]);
      else {
        const res = await fetch("/api/user/cart", { method: "DELETE", headers: headers(), body: "{}" });
        if (!res.ok) throw new Error("Не удалось очистить корзину");
        window.dispatchEvent(new Event("cart-updated"));
      }
      localStorage.removeItem("promoCode");
      await refresh("", true);
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка корзины"); }
  };
  return { ...quote, clearCart, token, loading, error, refresh, updateQty, removeItem: (id: string, pack: boolean) => updateQty(id, 0, pack), applyPromo: (code: string) => refresh(code, true), removePromo: () => refresh("", true) };
}
