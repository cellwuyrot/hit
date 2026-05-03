"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, startTransition } from "react";
import { showToast } from "@/components/Toast";

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  oldPrice?: number | null;
  image: string;
  inStock: number;
  categorySlug: string;
}

export default function ProductCard({
  id,
  name,
  slug,
  price,
  oldPrice,
  image,
  inStock,
}: ProductCardProps) {
  const [added, setAdded] = useState(false);
  const [inCompare, setInCompare] = useState(false);

  useEffect(() => {
    const list: { id: string }[] = JSON.parse(localStorage.getItem("compare") || "[]");
    startTransition(() => setInCompare(list.some((p) => p.id === id)));
  }, [id]);

  const addToCart = async () => {
    const token = localStorage.getItem("userToken");
    if (!token) { window.location.href = "/account"; return; }
    await fetch("/api/user/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId: id, quantity: 1 }),
    });
    setAdded(true);
    showToast(`«${name.slice(0, 30)}${name.length > 30 ? "..." : ""}» добавлен в корзину`);
    setTimeout(() => setAdded(false), 2000);
  };

  const toggleCompare = () => {
    const list: { id: string; name: string }[] = JSON.parse(localStorage.getItem("compare") || "[]");
    if (inCompare) {
      localStorage.setItem("compare", JSON.stringify(list.filter((p) => p.id !== id)));
      setInCompare(false);
    } else {
      list.push({ id, name });
      localStorage.setItem("compare", JSON.stringify(list));
      setInCompare(true);
    }
  };

  return (
    <div className="bg-bg-white rounded-xl border border-border hover:shadow-lg transition-shadow p-3 sm:p-4 flex flex-col">
      <Link href={`/product/${slug}`} className="block">
        <div className="relative aspect-square mb-2 sm:mb-3 bg-bg-light rounded-lg flex items-center justify-center overflow-hidden">
          {image ? (
            <Image src={image} alt={name} fill className="object-contain p-2" />
          ) : (
            <div className="flex flex-col items-center justify-center text-text-light">
              <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs mt-1">Нет фото</span>
            </div>
          )}
          {oldPrice && (
            <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-danger text-white text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md">
              -{Math.round(((oldPrice - price) / oldPrice) * 100)}%
            </span>
          )}
        </div>
      </Link>

      <Link href={`/product/${slug}`} className="block">
        <h3 className="text-xs sm:text-sm font-medium text-text-dark leading-tight mb-1.5 sm:mb-2 line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] hover:text-primary transition-colors">{name}</h3>
      </Link>

      <div className="flex items-center gap-1 mb-1.5 sm:mb-2">
        {inStock > 0 ? (
          <>
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-success">В наличии</span>
          </>
        ) : (
          <span className="text-xs text-danger">Нет в наличии</span>
        )}
      </div>

      <div className="mt-auto">
        <div className="flex items-baseline gap-1 sm:gap-2">
          <span className="text-base sm:text-lg font-bold text-text-dark">{price.toLocaleString("ru-RU")} ₽</span>
        </div>
        {oldPrice && (
          <span className="text-xs sm:text-sm text-text-light line-through">{oldPrice.toLocaleString("ru-RU")} ₽</span>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-2 sm:mt-3 space-y-1.5 sm:space-y-2">
        <button onClick={addToCart} disabled={inStock === 0}
          className={`w-full text-xs sm:text-sm font-medium py-2 sm:py-2.5 rounded-lg transition-colors ${
            added ? "bg-success text-white" : inStock === 0 ? "bg-gray-200 text-text-gray cursor-not-allowed" : "bg-primary hover:bg-primary-dark text-white"
          }`}>
          {added ? "Добавлено!" : inStock === 0 ? "Нет в наличии" : "В корзину"}
        </button>

        <div className="flex gap-1.5 sm:gap-2">
          <button onClick={toggleCompare}
            className={`flex-1 flex items-center justify-center gap-1 text-xs py-1.5 sm:py-2 rounded-lg border transition-colors ${
              inCompare ? "border-primary text-primary bg-primary/5" : "border-border text-text-gray hover:text-primary hover:border-primary"
            }`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="hidden sm:inline">{inCompare ? "В сравнении" : "Сравнить"}</span>
          </button>

          <Link href={`/wholesale?product=${encodeURIComponent(name)}`}
            className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 sm:py-2 rounded-lg border border-border text-text-gray hover:text-primary hover:border-primary transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="hidden sm:inline">Оптом</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
