"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  inStock: number;
  category: { name: string; slug: string };
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchInput = (val: string) => {
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(val.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
          setShowSuggestions(data.length > 0);
        }
      } catch {}
    }, 300);
  };

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (q) {
      router.push(`/catalog?search=${encodeURIComponent(q)}`);
      setSearchQuery("");
      setMenuOpen(false);
      setShowSuggestions(false);
    }
  };

  const goToProduct = (slug: string) => {
    router.push(`/product/${slug}`);
    setSearchQuery("");
    setShowSuggestions(false);
    setMenuOpen(false);
  };

  const getImageSrc = (image: string) => {
    if (!image) return "";
    if (image.startsWith("http")) return image;
    if (image.startsWith("/uploads/")) return `/api${image}`;
    if (image.startsWith("/")) return `/api/static${image}`;
    return image;
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
            <span>Москва и МО</span>
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
                <h1 className="text-lg sm:text-xl font-bold text-primary leading-tight font-heading">ТОПХИТ</h1>
                <p className="text-[10px] sm:text-xs text-text-gray leading-tight">интернет-магазин</p>
              </div>
            </div>
          </Link>

          {/* Search with autocomplete - hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-xl" ref={searchRef}>
            <div className="relative w-full">
              <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="Поиск товаров..."
                  className="w-full border border-border rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button type="submit" aria-label="Поиск" className="absolute right-3 top-1/2 -translate-y-1/2 text-text-gray hover:text-primary transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>

              {/* Autocomplete dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-lg z-50 overflow-hidden autocomplete-dropdown">
                  {suggestions.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => goToProduct(item.slug)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-bg-light transition-colors text-left"
                    >
                      <div className="w-10 h-10 bg-bg-light rounded-lg flex-shrink-0 overflow-hidden relative">
                        {item.image ? (
                          <Image src={getImageSrc(item.image)} alt="" fill className="object-contain p-1" />
                        ) : (
                          <span className="flex items-center justify-center h-full text-text-light text-xs">📦</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-dark truncate">{item.name}</p>
                        <p className="text-xs text-text-gray">{item.category.name}</p>
                      </div>
                      <span className="text-sm font-bold text-text-dark flex-shrink-0">{item.price.toLocaleString("ru-RU")} ₽</span>
                    </button>
                  ))}
                  <button
                    onClick={handleSearch}
                    className="w-full py-2.5 text-center text-sm text-primary hover:bg-primary/5 border-t border-border transition-colors"
                  >
                    Показать все результаты
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/wishlist" className="hidden sm:flex flex-col items-center text-text-gray hover:text-danger transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-[10px] sm:text-xs mt-0.5">Избранное</span>
            </Link>
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
                  <span className="absolute -top-2 -right-2 bg-danger text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-count-pulse">
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
              aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
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
          <div className="md:hidden mt-3 pb-2 border-t border-border pt-3 animate-fade-in">
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder="Поиск товаров..."
                className="w-full border border-border rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:border-primary"
              />
              <button type="submit" aria-label="Поиск" className="absolute right-3 top-1/2 -translate-y-1/2 text-text-gray hover:text-primary">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>

            {/* Mobile autocomplete */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="mt-2 bg-white border border-border rounded-xl shadow-lg overflow-hidden">
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => goToProduct(item.slug)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-bg-light transition-colors text-left border-b border-border last:border-b-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-dark truncate">{item.name}</p>
                    </div>
                    <span className="text-sm font-bold text-text-dark flex-shrink-0">{item.price.toLocaleString("ru-RU")} ₽</span>
                  </button>
                ))}
              </div>
            )}

            <nav className="mt-3 flex flex-col">
              <Link href="/catalog" className="text-text-dark hover:text-primary hover:bg-bg-light py-2.5 px-3 rounded-lg font-medium transition-colors" onClick={() => setMenuOpen(false)}>Каталог</Link>
              <Link href="/wholesale" className="text-text-dark hover:text-primary hover:bg-bg-light py-2.5 px-3 rounded-lg transition-colors" onClick={() => setMenuOpen(false)}>Оптовые продажи</Link>
              <Link href="/news" className="text-text-dark hover:text-primary hover:bg-bg-light py-2.5 px-3 rounded-lg transition-colors" onClick={() => setMenuOpen(false)}>Новости</Link>
              <Link href="/about#delivery" className="text-text-dark hover:text-primary hover:bg-bg-light py-2.5 px-3 rounded-lg transition-colors" onClick={() => setMenuOpen(false)}>Доставка</Link>
              <Link href="/about" className="text-text-dark hover:text-primary hover:bg-bg-light py-2.5 px-3 rounded-lg transition-colors" onClick={() => setMenuOpen(false)}>О компании</Link>
              <Link href="/about#contacts" className="text-text-dark hover:text-primary hover:bg-bg-light py-2.5 px-3 rounded-lg transition-colors" onClick={() => setMenuOpen(false)}>Контакты</Link>
              <div className="border-t border-border my-2" />
              <Link href="/wishlist" className="text-text-dark hover:text-primary hover:bg-bg-light py-2.5 px-3 rounded-lg transition-colors" onClick={() => setMenuOpen(false)}>Избранное</Link>
              <Link href="/compare" className="text-text-dark hover:text-primary hover:bg-bg-light py-2.5 px-3 rounded-lg transition-colors" onClick={() => setMenuOpen(false)}>Сравнение</Link>
              <Link href="/cart" className="text-text-dark hover:text-primary hover:bg-bg-light py-2.5 px-3 rounded-lg transition-colors" onClick={() => setMenuOpen(false)}>Корзина</Link>
              <Link href="/account" className="text-text-dark hover:text-primary hover:bg-bg-light py-2.5 px-3 rounded-lg transition-colors" onClick={() => setMenuOpen(false)}>Вход / Кабинет</Link>
              <div className="border-t border-border my-2" />
            </nav>
          </div>
        )}
      </div>

      {/* Navigation bar */}
      <nav className="bg-bg-white border-t border-border hidden md:block">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center gap-4 lg:gap-6 text-sm py-3">
            <li><Link href="/catalog" className="text-text-dark hover:text-primary font-medium transition-colors">Каталог</Link></li>
            <li><Link href="/wholesale" className="text-text-gray hover:text-primary transition-colors">Оптовые продажи</Link></li>
            <li><Link href="/news" className="text-text-gray hover:text-primary transition-colors">Новости</Link></li>
            <li><Link href="/about#delivery" className="text-text-gray hover:text-primary transition-colors">Доставка</Link></li>
            <li><Link href="/about" className="text-text-gray hover:text-primary transition-colors">О компании</Link></li>
            <li><Link href="/about#contacts" className="text-text-gray hover:text-primary transition-colors">Контакты</Link></li>
          </ul>
        </div>
      </nav>
    </header>
  );
}
