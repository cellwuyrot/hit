"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CallbackModal from "@/components/CallbackModal";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchCart = async () => {
      const token = localStorage.getItem("userToken");
      if (!token) return;
      try {
        const res = await fetch("/api/user/cart", { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const items = await res.json();
          setCartCount(items.reduce((sum: number, i: { quantity: number }) => sum + i.quantity, 0));
        }
      } catch {}
    };
    fetchCart();
    const interval = setInterval(fetchCart, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (q) {
      router.push(`/catalog?search=${encodeURIComponent(q)}`);
      setSearchQuery("");
      setMenuOpen(false);
    }
  };

  return (
    <header className="bg-bg-white shadow-sm">
      {/* Top bar */}
      <div className="bg-primary text-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between text-[11px] sm:text-sm">
          <div className="flex items-center gap-2 sm:gap-4">
            <span>ПН-ПТ 09:00–18:00</span>
            <span className="hidden sm:inline">СБ-ВС: Выходной</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden md:inline">Москва и МО</span>
            <a href="tel:+79362568950" className="font-bold hover:underline">
              +7 (936) 256-89-50
            </a>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Image src="/logo.png" alt="ТОПХИТ" width={40} height={40} className="w-8 h-8 sm:w-10 sm:h-10" />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-primary leading-tight">ТОПХИТ</h1>
                <p className="text-[10px] sm:text-xs text-text-gray leading-tight">интернет-магазин</p>
              </div>
            </div>
          </Link>

          {/* Search - hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-xl">
            <form className="relative w-full" onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск товаров..."
                className="w-full border border-border rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:border-primary transition-colors"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-text-gray hover:text-primary transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>

          {/* Contact info */}
          <div className="hidden lg:flex flex-col items-end">
            <a href="tel:+79362568950" className="text-lg font-bold text-text-dark hover:text-primary transition-colors">
              +7 (936) 256-89-50
            </a>
            <CallbackModal />
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/compare" className="hidden sm:flex flex-col items-center text-text-gray hover:text-primary transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-[10px] sm:text-xs mt-0.5">Сравнение</span>
            </Link>
            <Link href="/cart" className="flex flex-col items-center text-text-gray hover:text-primary transition-colors relative">
              <div className="relative">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-danger text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-xs mt-0.5">Корзина</span>
            </Link>
            <Link href="/account" className="flex flex-col items-center text-text-gray hover:text-primary transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-[10px] sm:text-xs mt-0.5">Вход</span>
            </Link>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden text-text-gray hover:text-primary transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile search + menu */}
        {menuOpen && (
          <div className="md:hidden mt-3 pb-2 border-t border-border pt-3">
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск товаров..."
                className="w-full border border-border rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:border-primary"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-text-gray hover:text-primary">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
            <nav className="mt-3 flex flex-col">
              <Link href="/catalog" className="text-text-dark hover:text-primary hover:bg-bg-light py-2.5 px-3 rounded-lg font-medium transition-colors" onClick={() => setMenuOpen(false)}>Каталог</Link>
              <Link href="/wholesale" className="text-text-dark hover:text-primary hover:bg-bg-light py-2.5 px-3 rounded-lg transition-colors" onClick={() => setMenuOpen(false)}>Оптовые продажи</Link>
              <Link href="/news" className="text-text-dark hover:text-primary hover:bg-bg-light py-2.5 px-3 rounded-lg transition-colors" onClick={() => setMenuOpen(false)}>Новости</Link>
              <Link href="/about#delivery" className="text-text-dark hover:text-primary hover:bg-bg-light py-2.5 px-3 rounded-lg transition-colors" onClick={() => setMenuOpen(false)}>Доставка</Link>
              <Link href="/about" className="text-text-dark hover:text-primary hover:bg-bg-light py-2.5 px-3 rounded-lg transition-colors" onClick={() => setMenuOpen(false)}>О компании</Link>
              <Link href="/about#contacts" className="text-text-dark hover:text-primary hover:bg-bg-light py-2.5 px-3 rounded-lg transition-colors" onClick={() => setMenuOpen(false)}>Контакты</Link>
              <div className="border-t border-border my-2" />
              <Link href="/compare" className="text-text-dark hover:text-primary hover:bg-bg-light py-2.5 px-3 rounded-lg transition-colors" onClick={() => setMenuOpen(false)}>Сравнение</Link>
              <Link href="/cart" className="text-text-dark hover:text-primary hover:bg-bg-light py-2.5 px-3 rounded-lg transition-colors" onClick={() => setMenuOpen(false)}>Корзина</Link>
              <Link href="/account" className="text-text-dark hover:text-primary hover:bg-bg-light py-2.5 px-3 rounded-lg transition-colors" onClick={() => setMenuOpen(false)}>Вход / Кабинет</Link>
              <div className="border-t border-border my-2" />
              <a href="tel:+79362568950" className="text-primary font-bold py-2.5 px-3">+7 (936) 256-89-50</a>
            </nav>
          </div>
        )}
      </div>

      {/* Navigation bar */}
      <nav className="bg-bg-white border-t border-border hidden md:block">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center gap-4 lg:gap-6 text-sm py-3">
            <li>
              <Link href="/catalog" className="text-text-dark hover:text-primary font-medium transition-colors">Каталог</Link>
            </li>
            <li>
              <Link href="/wholesale" className="text-text-gray hover:text-primary transition-colors">Оптовые продажи</Link>
            </li>
            <li>
              <Link href="/news" className="text-text-gray hover:text-primary transition-colors">Новости</Link>
            </li>
            <li>
              <Link href="/about#delivery" className="text-text-gray hover:text-primary transition-colors">Доставка</Link>
            </li>
            <li>
              <Link href="/about" className="text-text-gray hover:text-primary transition-colors">О компании</Link>
            </li>
            <li>
              <Link href="/about#contacts" className="text-text-gray hover:text-primary transition-colors">Контакты</Link>
            </li>

          </ul>
        </div>
      </nav>
    </header>
  );
}
