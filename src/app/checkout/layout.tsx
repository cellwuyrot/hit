import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Оформление заказа — ТОПХИТ",
  description: "Оформите заказ в интернет-магазине ТОПХИТ. Доставка по Москве и МО или самовывоз со склада.",
  robots: { index: false, follow: true },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
