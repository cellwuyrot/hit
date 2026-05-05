"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface ViewedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
}

export default function RecentlyViewed() {
  const [products, setProducts] = useState<ViewedProduct[]>([]);

  useEffect(() => {
    try {
      const viewed: ViewedProduct[] = JSON.parse(localStorage.getItem("recentlyViewed") || "[]");
      setProducts(viewed.slice(0, 6));
    } catch {}
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <h2 className="font-heading text-base sm:text-lg font-bold text-text-dark mb-3 sm:mb-4">Вы недавно смотрели</h2>
      <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {products.map((p) => (
          <Link key={p.id} href={`/product/${p.slug}`}
            className="flex-shrink-0 w-32 sm:w-40 bg-bg-white rounded-xl border border-border p-2.5 sm:p-3 hover:shadow-md transition-shadow">
            <div className="relative aspect-square mb-2 bg-bg-light rounded-lg overflow-hidden">
              {p.image ? (
                <Image src={p.image} alt={p.name} fill className="object-contain p-1" />
              ) : (
                <span className="flex items-center justify-center h-full text-xl text-text-light">📦</span>
              )}
            </div>
            <h3 className="text-xs sm:text-sm text-text-dark line-clamp-2 mb-1">{p.name}</h3>
            <span className="text-xs sm:text-sm font-bold text-primary">{p.price.toLocaleString("ru-RU")} ₽</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function trackProductView(product: ViewedProduct) {
  try {
    const viewed: ViewedProduct[] = JSON.parse(localStorage.getItem("recentlyViewed") || "[]");
    const filtered = viewed.filter((p) => p.id !== product.id);
    filtered.unshift(product);
    localStorage.setItem("recentlyViewed", JSON.stringify(filtered.slice(0, 20)));
  } catch {}
}
