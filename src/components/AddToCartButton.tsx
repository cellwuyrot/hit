"use client";

import { useState } from "react";

export default function AddToCartButton({ productId, inStock }: { productId: string; inStock: number }) {
  const [added, setAdded] = useState(false);

  const addToCart = async () => {
    const token = localStorage.getItem("userToken");
    if (!token) { window.location.href = "/account"; return; }
    await fetch("/api/user/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <button onClick={addToCart} disabled={inStock === 0}
      className={`flex-1 sm:flex-none px-8 py-3 rounded-lg font-medium transition-colors ${
        added ? "bg-success text-white" : inStock === 0 ? "bg-gray-200 text-text-gray cursor-not-allowed" : "bg-primary hover:bg-primary-dark text-white"
      }`}>
      {added ? "Добавлено!" : inStock === 0 ? "Нет в наличии" : "В корзину"}
    </button>
  );
}
