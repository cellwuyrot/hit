import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "МагазинПро — Интернет-магазин товаров",
  description: "Интернет-магазин товаров для дома, строительства и ремонта",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
