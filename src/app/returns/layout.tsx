import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Возврат и обмен — ТОПХИТ",
  description: "Условия возврата и обмена товаров в интернет-магазине ТОПХИТ. Возврат в течение 14 дней без лишних вопросов.",
  alternates: { canonical: "https://tophitt.ru/returns" },
};

export default function ReturnsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
