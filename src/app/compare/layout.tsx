import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Сравнение товаров — ТОПХИТ",
  description: "Сравните характеристики и цены выбранных товаров в интернет-магазине ТОПХИТ. Выберите лучший вариант.",
  robots: { index: false, follow: true },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
