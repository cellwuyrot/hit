"use client";
import Link from "next/link";
import { useState } from "react";

type Child = { id: string; name: string; slug: string; _count: { products: number } };
type Category = { id: string; name: string; slug: string; _count: { products: number }; children: Child[] };
function countLabel(n: number) { const mod = n % 100, last = n % 10; return `${n} ${mod >= 11 && mod <= 14 ? "товаров" : last === 1 ? "товар" : last >= 2 && last <= 4 ? "товара" : "товаров"}`; }
export default function CategoryBrowser({ categories }: { categories: Category[] }) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const q = query.trim().toLocaleLowerCase("ru");
  const filtered = categories.filter(c => !q || c.name.toLocaleLowerCase("ru").includes(q) || c.children.some(ch => ch.name.toLocaleLowerCase("ru").includes(q)));
  const shown = q || expanded ? filtered : filtered.slice(0, 8);
  return <section aria-label="Категории каталога" className="mb-7"><div className="flex flex-wrap justify-between items-end gap-3 mb-4"><div><h2 className="text-xl font-bold text-text-dark">Выберите категорию</h2><p className="text-sm text-text-gray mt-1">Откройте раздел или найдите его по названию</p></div><div className="w-full sm:w-64"><label htmlFor="category-search" className="sr-only">Поиск по категориям</label><input id="category-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Найти категорию" className="w-full min-h-11 rounded-lg border border-border bg-white px-3 text-sm" /></div></div>
    {shown.length === 0 ? <p className="bg-white border border-border rounded-xl p-4 text-sm text-text-gray">Категории не найдены. Попробуйте другое название.</p> : <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">{shown.map(cat => {const total = cat._count.products + cat.children.reduce((sum, c) => sum + c._count.products, 0);const children = q && !cat.name.toLocaleLowerCase("ru").includes(q) ? cat.children.filter(c => c.name.toLocaleLowerCase("ru").includes(q)) : cat.children;return <article key={cat.id} className="rounded-xl border border-border bg-white p-4"><Link href={`/catalog/${cat.slug}`} className="flex justify-between gap-3 group min-h-11"><span><span className="block font-semibold text-text-dark group-hover:text-primary">{cat.name}</span><span className="block text-sm text-text-gray mt-1">{countLabel(total)}</span></span><span aria-hidden="true" className="text-primary text-lg">↗</span></Link>{children.length > 0 && <details className="border-t border-border mt-3 pt-3" open={q ? true : undefined}><summary className="text-sm text-primary cursor-pointer">Подкатегории · {children.length}</summary><ul className="space-y-2 pt-3">{children.map(child => <li key={child.id}><Link className="text-sm text-text-gray hover:text-primary" href={`/catalog/${cat.slug}/${child.slug}`}>{child.name} <span className="text-text-light">· {countLabel(child._count.products)}</span></Link></li>)}</ul></details>}</article>})}</div>}
    {!q && categories.length > 8 && <button type="button" onClick={() => setExpanded(!expanded)} className="text-primary font-semibold text-sm min-h-11 mt-2">{expanded ? "Свернуть категории" : `Показать все категории (${categories.length})`}</button>}
  </section>;
}
