"use client";

import Image from "next/image";
import { useState } from "react";

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
  price,
  oldPrice,
  image,
  inStock,
}: ProductCardProps) {
  const [added, setAdded] = useState(false);

  const addToCart = async () => {
    const token = localStorage.getItem("userToken");
    if (!token) {
      window.location.href = "/account";
      return;
    }
    await fetch("/api/user/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId: id, quantity: 1 }),
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="bg-bg-white rounded-xl border border-border hover:shadow-lg transition-shadow p-4 flex flex-col">
      <div className="relative aspect-square mb-3 bg-bg-light rounded-lg flex items-center justify-center overflow-hidden">
        {image ? (
          <Image src={image} alt={name} fill className="object-contain p-2" />
        ) : (
          <div className="flex flex-col items-center justify-center text-text-light">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs mt-1">Нет фото</span>
          </div>
        )}
        {oldPrice && (
          <span className="absolute top-2 left-2 bg-danger text-white text-xs font-bold px-2 py-1 rounded-md">
            -{Math.round(((oldPrice - price) / oldPrice) * 100)}%
          </span>
        )}
      </div>

      <h3 className="text-sm font-medium text-text-dark leading-tight mb-2 line-clamp-2 min-h-[2.5rem]">{name}</h3>

      <div className="flex items-center gap-1 mb-2">
        {inStock > 0 ? (
          <>
            <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-success">Есть в наличии ({inStock})</span>
          </>
        ) : (
          <span className="text-xs text-danger">Нет в наличии</span>
        )}
      </div>

      <div className="mt-auto">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-text-dark">{price.toLocaleString("ru-RU")} ₽</span>
        </div>
        {oldPrice && (
          <span className="text-sm text-text-light line-through">{oldPrice.toLocaleString("ru-RU")} ₽</span>
        )}
      </div>

      <button onClick={addToCart} disabled={inStock === 0}
        className={`mt-3 w-full text-sm font-medium py-2.5 rounded-lg transition-colors ${
          added ? "bg-success text-white" : inStock === 0 ? "bg-gray-200 text-text-gray cursor-not-allowed" : "bg-primary hover:bg-primary-dark text-white"
        }`}>
        {added ? "Добавлено!" : inStock === 0 ? "Нет в наличии" : "В корзину"}
      </button>
    </div>
  );
}
