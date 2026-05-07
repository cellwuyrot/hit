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

export function AddPackButton({ productId, inStock, packSize, price }: { productId: string; inStock: number; packSize: number; price: number }) {
  const [addedPack, setAddedPack] = useState(false);

  const addPack = async () => {
    const token = localStorage.getItem("userToken");
    if (!token) { window.location.href = "/account"; return; }
    await fetch("/api/user/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId, quantity: packSize, isPack: true }),
    });
    setAddedPack(true);
    setTimeout(() => setAddedPack(false), 2000);
  };

  const packTotal = Math.round(price * packSize * 0.9);

  if (!packSize || packSize <= 1 || inStock === 0) return null;

  return (
    <button onClick={addPack}
      className={`w-full px-6 py-3 rounded-lg font-medium transition-colors text-sm ${
        addedPack ? "bg-success text-white" : "bg-green-600 hover:bg-green-700 text-white"
      }`}>
      {addedPack ? "Упаковка добавлена!" : `1 упаковка (${packSize} шт.) — ${packTotal.toLocaleString("ru-RU")} ₽ (скидка 10%)`}
    </button>
  );
}
