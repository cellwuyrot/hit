import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Личный кабинет — ТОПХИТ",
  description: "Личный кабинет покупателя ТОПХИТ. Управляйте заказами, профилем и адресами доставки.",
  robots: { index: false, follow: true },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
