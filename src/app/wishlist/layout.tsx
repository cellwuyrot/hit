import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Избранное — ТОПХИТ",
  description: "Ваши избранные товары в интернет-магазине ТОПХИТ. Сохраняйте понравившиеся товары и покупайте по лучшей цене.",
  robots: { index: false, follow: true },
};

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
