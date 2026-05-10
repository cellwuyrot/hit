"use client";

import { useState, useRef } from "react";

function flyToCart(buttonEl: HTMLElement) {
  const cartIcon = document.getElementById("cart-icon");
  if (!cartIcon) return;

  const btnRect = buttonEl.getBoundingClientRect();
  const cartRect = cartIcon.getBoundingClientRect();

  const flyX = cartRect.left - btnRect.left;
  const flyY = cartRect.top - btnRect.top;

  const ghost = document.createElement("div");
  ghost.className = "animate-fly-to-cart";
  ghost.style.cssText = `left:${btnRect.left}px;top:${btnRect.top}px;width:40px;height:40px;border-radius:50%;background:var(--color-primary);display:flex;align-items:center;justify-content:center;`;
  ghost.style.setProperty("--fly-x", `${flyX}px`);
  ghost.style.setProperty("--fly-y", `${flyY}px`);
  ghost.innerHTML = `<svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/></svg>`;
  document.body.appendChild(ghost);
  setTimeout(() => ghost.remove(), 700);
}

export default function AddToCartButton({ productId, inStock }: { productId: string; inStock: number }) {
  const [added, setAdded] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const addToCart = async () => {
    const token = localStorage.getItem("userToken");
    if (!token) { window.location.href = "/account"; return; }
    await fetch("/api/user/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    if (btnRef.current) flyToCart(btnRef.current);
    window.dispatchEvent(new Event("cart-updated"));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <button ref={btnRef} onClick={addToCart} disabled={inStock === 0}
      className={`flex-1 sm:flex-none px-8 py-3 rounded-lg font-medium transition-all duration-300 ${
        added ? "bg-success text-white scale-95" : inStock === 0 ? "bg-gray-200 text-text-gray cursor-not-allowed" : "bg-primary hover:bg-primary-dark text-white active:scale-95"
      }`}>
      {added ? "Добавлено!" : inStock === 0 ? "Нет в наличии" : "В корзину"}
    </button>
  );
}

export function AddPackButton({ productId, inStock, packSize, price }: { productId: string; inStock: number; packSize: number; price: number }) {
  const [addedPack, setAddedPack] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const addPack = async () => {
    const token = localStorage.getItem("userToken");
    if (!token) { window.location.href = "/account"; return; }
    await fetch("/api/user/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId, quantity: packSize, isPack: true }),
    });
    if (btnRef.current) flyToCart(btnRef.current);
    window.dispatchEvent(new Event("cart-updated"));
    setAddedPack(true);
    setTimeout(() => setAddedPack(false), 2000);
  };

  const packTotal = Math.round(price * packSize * 0.9);

  if (!packSize || packSize <= 1 || inStock === 0) return null;

  return (
    <button ref={btnRef} onClick={addPack}
      className={`w-full px-6 py-3 rounded-lg font-medium transition-all duration-300 text-sm ${
        addedPack ? "bg-success text-white scale-95" : "bg-green-600 hover:bg-green-700 text-white active:scale-95"
      }`}>
      {addedPack ? "Упаковка добавлена!" : `1 упаковка (${packSize} шт.) — ${packTotal.toLocaleString("ru-RU")} ₽ (скидка 10%)`}
    </button>
  );
}
