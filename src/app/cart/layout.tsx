import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Корзина — ТОПХИТ",
  description: "Ваша корзина покупок в интернет-магазине ТОПХИТ. Проверьте выбранные товары и оформите заказ с доставкой по Москве и МО.",
  robots: { index: false, follow: true },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
