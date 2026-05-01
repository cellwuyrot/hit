"use client";

import Link from "next/link";

const tabs = [
  { key: "all", label: "Все" },
  { key: "delivery", label: "Поставки" },
  { key: "article", label: "Статьи" },
];

export default function NewsFilter({ activeType }: { activeType: string }) {
  return (
    <div className="flex gap-2 mb-6 flex-wrap">
      {tabs.map((t) => (
        <Link key={t.key} href={t.key === "all" ? "/news" : `/news?type=${t.key}`}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeType === t.key ? "bg-primary text-white" : "bg-bg-white border border-border text-text-gray hover:border-primary"}`}>
          {t.label}
        </Link>
      ))}
    </div>
  );
}
