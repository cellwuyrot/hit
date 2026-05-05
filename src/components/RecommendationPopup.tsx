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

    fetch(`/api/products/recommend?${params}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          startTransition(() => {
            setProduct(data);
            setVisible(true);
          });
          sessionStorage.setItem("rec_shown", "1");
        }
      })
      .catch(() => {});
  }, []);

  if (!visible || !product) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setVisible(false)}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 animate-in fade-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => setVisible(false)} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors text-xl">&times;</button>

        <div className="text-center mb-3">
          <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-2">Рекомендация магазина</span>
          <h3 className="text-lg font-bold text-gray-900">Вам может понравиться</h3>
        </div>

        <Link href={`/product/${product.slug}`} onClick={() => setVisible(false)} className="block group">
          <div className="relative aspect-square mb-3 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden">
            {product.image ? (
              <Image src={product.image} alt={product.name} fill className="object-contain p-3 group-hover:scale-105 transition-transform" />
            ) : (
              <div className="text-gray-300 text-4xl">📦</div>
            )}
            {product.oldPrice && (
              <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                -{Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%
              </span>
            )}
          </div>

          <h4 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">{product.name}</h4>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-xl font-bold text-gray-900">{product.price.toLocaleString("ru-RU")} ₽</span>
            {product.oldPrice && (
              <span className="text-sm text-gray-400 line-through">{product.oldPrice.toLocaleString("ru-RU")} ₽</span>
            )}
          </div>
          <p className="text-xs text-gray-500">{product.category.name}</p>
        </Link>

        <Link href={`/product/${product.slug}`} onClick={() => setVisible(false)}
          className="block w-full mt-4 bg-primary text-white text-center py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors text-sm">
          Подробнее
        </Link>
      </div>
    </div>
  );
}
