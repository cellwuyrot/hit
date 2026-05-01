import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ТОПХИТ — Интернет-магазин товаров",
  description: "ТОПХИТ — динамично развивающаяся торговая компания. Широкий ассортимент товаров для повседневной жизни, бизнеса и семьи. Продукты питания, бытовая химия, электроника, товары для дома. Доставка по Москве и МО.",
  keywords: "интернет-магазин, ТОПХИТ, продукты, бытовая химия, электроника, оптовые продажи, доставка Москва",
  openGraph: {
    title: "ТОПХИТ — Интернет-магазин товаров",
    description: "Широкий ассортимент товаров по честным ценам с доставкой по Москве и МО",
    locale: "ru_RU",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: "/apple-touch-icon.png",
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
