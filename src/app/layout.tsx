import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ТОПХИТ — Интернет-магазин товаров",
  description: "ТОПХИТ — интернет-магазин: продукты питания, бытовая химия, электроника, товары для сада. Низкие цены, быстрая доставка по Москве и МО.",
  keywords: "интернет-магазин, продукты, бытовая химия, электроника, садоводство, доставка Москва",
  openGraph: {
    title: "ТОПХИТ — Интернет-магазин товаров",
    description: "Широкий ассортимент товаров по низким ценам с доставкой по Москве и МО",
    locale: "ru_RU",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased">
      <head>
        <meta name="yandex-verification" content="" />
        <meta name="google-site-verification" content="" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
