"use client";
import { useRouter } from "next/navigation";

const options = [
  { key: "popular", label: "По популярности" },
  { key: "name", label: "По алфавиту" },
  { key: "price_asc", label: "По цене ↑" },
  { key: "price_desc", label: "По цене ↓" },
];

export default function CatalogSort({ current, searchParams }: { current: string; searchParams: Record<string, string | undefined> }) {
  const router = useRouter();
  function onChange(value: string) {
    const params = new URLSearchParams();
    for (const [key, val] of Object.entries(searchParams)) if (typeof val === "string" && key !== "sort" && key !== "page") params.set(key, val);
    params.set("sort", value);
    router.push(`?${params.toString()}`);
  }
  return <label className="flex items-center gap-2 text-sm text-text-gray"><span className="sr-only">Сортировка</span><select aria-label="Сортировка" value={options.some(option => option.key === current) ? current : "popular"} onChange={e => onChange(e.target.value)} className="min-h-11 max-w-full bg-white border border-border rounded-lg px-3 text-text-dark">{options.map(option => <option key={option.key} value={option.key}>{option.label}</option>)}</select></label>;
}
