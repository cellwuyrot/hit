"use client";

import { useState } from "react";

export default function AddToCartButton({ productId, inStock, packSize, price }: { productId: string; inStock: number; packSize?: number | null; price: number }) {
  const [added, setAdded] = useState(false);
  const [addedPack, setAddedPack] = useState(false);

  const addToCart = async (isPack = false) => {
    const token = localStorage.getItem("userToken");
    if (!token) { window.location.href = "/account"; return; }
    const qty = isPack && packSize ? packSize : 1;
    await fetch("/api/user/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId, quantity: qty, isPack }),
    });
    if (isPack) {
      setAddedPack(true);
      setTimeout(() => setAddedPack(false), 2000);
    } else {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  const packTotal = packSize ? Math.round(price * packSize * 0.9) : 0;

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full">
      <button onClick={() => addToCart(false)} disabled={inStock === 0}
        className={`flex-1 sm:flex-none px-8 py-3 rounded-lg font-medium transition-colors ${
          added ? "bg-success text-white" : inStock === 0 ? "bg-gray-200 text-text-gray cursor-not-allowed" : "bg-primary hover:bg-primary-dark text-white"
        }`}>
        {added ? "Добавлено!" : inStock === 0 ? "Нет в наличии" : "В корзину"}
      </button>
      {packSize && packSize > 1 && inStock > 0 && (
        <button onClick={() => addToCart(true)}
          className={`flex-1 sm:flex-none px-6 py-3 rounded-lg font-medium transition-colors ${
            addedPack ? "bg-success text-white" : "bg-green-600 hover:bg-green-700 text-white"
          }`}>
          {addedPack ? "Упаковка добавлена!" : `1 упаковка (${packSize} шт.) — ${packTotal.toLocaleString("ru-RU")} ₽`}
        </button>
      )}
    </div>
  );
}
