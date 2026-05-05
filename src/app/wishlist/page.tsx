"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { SkeletonProductGrid } from "@/components/Skeleton";

interface WishlistProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  oldPrice: number | null;
  image: string;
  inStock: number;
  category: { slug: string };
}

interface WishlistItem {
  id: string;
  productId: string;
  product: WishlistProduct;
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (!token) { setLoading(false); return; }
    setLoggedIn(true);
    fetch("/api/user/wishlist", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        setItems(data);
        localStorage.setItem("wishlist", JSON.stringify(data.map((i: WishlistItem) => i.productId)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Header />
      <main className="flex-1 bg-bg-light">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-text-dark mb-6">Избранное</h1>

          {loading ? (
            <SkeletonProductGrid count={4} />
          ) : !loggedIn ? (
            <div className="bg-bg-white rounded-xl border border-border p-8 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <p className="text-text-gray mb-4">Авторизуйтесь, чтобы видеть избранные товары</p>
              <a href="/account" className="inline-block px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">Войти</a>
            </div>
          ) : items.length === 0 ? (
            <div className="bg-bg-white rounded-xl border border-border p-8 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <p className="text-text-gray mb-2">Список избранного пуст</p>
              <p className="text-sm text-text-light mb-4">Нажмите сердечко на карточке товара, чтобы добавить в избранное</p>
              <a href="/catalog" className="inline-block px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">Перейти в каталог</a>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
              {items.map((item) => (
                <ProductCard
                  key={item.id}
                  id={item.product.id}
                  name={item.product.name}
                  slug={item.product.slug}
                  price={item.product.price}
                  oldPrice={item.product.oldPrice}
                  image={item.product.image}
                  inStock={item.product.inStock}
                  categorySlug={item.product.category?.slug || ""}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
