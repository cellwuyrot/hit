"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-bg-white shadow-sm">
      {/* Top bar */}
      <div className="bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 py-1.5 sm:py-2 flex items-center justify-between text-xs sm:text-sm">
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
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
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
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Поиск товаров..."
                className="w-full border border-border rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:border-primary transition-colors"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-text-gray hover:text-primary transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Contact info */}
          <div className="hidden lg:flex flex-col items-end">
            <a href="tel:+79362568950" className="text-lg font-bold text-text-dark hover:text-primary transition-colors">
              +7 (936) 256-89-50
            </a>
            <button className="text-sm text-primary hover:underline">Заказать звонок</button>
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/compare" className="hidden sm:flex flex-col items-center text-text-gray hover:text-primary transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-[10px] sm:text-xs mt-0.5">Сравнение</span>
            </Link>
            <Link href="/cart" className="flex flex-col items-center text-text-gray hover:text-primary transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              <span className="text-[10px] sm:text-xs mt-0.5">Корзина</span>
            </Link>
            <Link href="/account" className="flex flex-col items-center text-text-gray hover:text-primary transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-[10px] sm:text-xs mt-0.5">Кабинет</span>
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
          <div className="md:hidden mt-3 pb-2">
            <input
              type="text"
              placeholder="Поиск товаров..."
              className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary"
            />
            <nav className="mt-3 flex flex-col gap-2">
              <Link href="/catalog" className="text-text-dark hover:text-primary py-1 font-medium" onClick={() => setMenuOpen(false)}>Каталог</Link>
              <Link href="/wholesale" className="text-text-dark hover:text-primary py-1" onClick={() => setMenuOpen(false)}>Оптовые продажи</Link>
              <Link href="/news" className="text-text-dark hover:text-primary py-1" onClick={() => setMenuOpen(false)}>Новости</Link>
              <Link href="/about#delivery" className="text-text-dark hover:text-primary py-1" onClick={() => setMenuOpen(false)}>Доставка</Link>
              <Link href="/about" className="text-text-dark hover:text-primary py-1" onClick={() => setMenuOpen(false)}>О компании</Link>
              <Link href="/about#contacts" className="text-text-dark hover:text-primary py-1" onClick={() => setMenuOpen(false)}>Контакты</Link>
              <Link href="/compare" className="text-text-dark hover:text-primary py-1" onClick={() => setMenuOpen(false)}>Сравнение</Link>
              <Link href="/cart" className="text-text-dark hover:text-primary py-1" onClick={() => setMenuOpen(false)}>Корзина</Link>
              <Link href="/account" className="text-text-dark hover:text-primary py-1" onClick={() => setMenuOpen(false)}>Личный кабинет</Link>
              <Link href="/admin" className="text-text-gray hover:text-primary py-1 text-sm" onClick={() => setMenuOpen(false)}>Админ-панель</Link>
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
            <li className="ml-auto">
              <Link href="/admin" className="text-text-gray hover:text-primary transition-colors">Админ-панель</Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}
