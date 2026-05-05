"use client";

import { useState, useEffect, startTransition } from "react";
import Link from "next/link";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  oldPrice?: number | null;
  image: string;
  inStock: number;
  categoryId: string;
  category: { slug: string; name: string };
}

export default function RecommendationPopup() {
  const [product, setProduct] = useState<Product | null>(null);
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("rec_shown")) return;

    const viewedCategories: string[] = JSON.parse(localStorage.getItem("viewed_categories") || "[]");

    const params = new URLSearchParams();
    if (viewedCategories.length > 0) {
      params.set("recommend", "targeted");
      params.set("categories", viewedCategories.join(","));
    } else {
      params.set("recommend", "random");
    }

    const timer = setTimeout(() => {
      fetch(`/api/products/recommend?${params}`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data) {
            startTransition(() => {
              setProduct(data);
              setVisible(true);
            });
            sessionStorage.setItem("rec_shown", "1");
            requestAnimationFrame(() => {
              requestAnimationFrame(() => setAnimateIn(true));
            });
          }
        })
        .catch(() => {});
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const close = () => {
    setAnimateIn(false);
    setTimeout(() => setVisible(false), 300);
  };

  if (!visible || !product) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 z-[9998] w-64 sm:w-72 transition-all duration-300 ease-out ${
        animateIn ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      } max-sm:left-2 max-sm:right-2 max-sm:bottom-2 max-sm:w-auto`}
    >
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
          <span className="text-xs font-semibold text-primary">Рекомендуем</span>
          <button onClick={close} className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors text-sm leading-none">&times;</button>
        </div>

        <Link href={`/product/${product.slug}`} onClick={close} className="flex gap-3 p-3 group">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-lg flex-shrink-0 overflow-hidden">
            {product.image ? (
              <Image src={product.image} alt={product.name} fill className="object-contain p-1" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">📦</div>
            )}
            {product.oldPrice && (
              <span className="absolute top-0.5 left-0.5 bg-red-500 text-white text-[10px] font-bold px-1 py-0.5 rounded">
                -{Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-medium text-gray-900 line-clamp-2 mb-1 group-hover:text-primary transition-colors">{product.name}</h4>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold text-gray-900">{product.price.toLocaleString("ru-RU")} ₽</span>
              {product.oldPrice && (
                <span className="text-xs text-gray-400 line-through">{product.oldPrice.toLocaleString("ru-RU")} ₽</span>
              )}
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">{product.category.name}</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
