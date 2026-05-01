"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useState, useEffect, startTransition } from "react";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  oldPrice: number | null;
  image: string;
  brand: string;
  color: string;
  productType: string;
  inStock: number;
  description: string;
  category: { name: string };
}

export default function ComparePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const list: { id: string }[] = JSON.parse(localStorage.getItem("compare") || "[]");
    if (list.length === 0) { startTransition(() => setLoading(false)); return; }

    Promise.all(
      list.map((item) =>
        fetch(`/api/products?id=${item.id}`).then((r) => r.ok ? r.json() : null)
      )
    ).then((results) => {
      startTransition(() => {
        setProducts(results.filter(Boolean));
        setLoading(false);
      });
    });
  }, []);

  const removeFromCompare = (id: string) => {
    const list: { id: string }[] = JSON.parse(localStorage.getItem("compare") || "[]");
    localStorage.setItem("compare", JSON.stringify(list.filter((p) => p.id !== id)));
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const clearAll = () => {
    localStorage.setItem("compare", "[]");
    setProducts([]);
  };

  return (
    <>
      <Header />
      <main className="flex-1 bg-bg-light">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <h1 className="text-2xl font-bold text-text-dark">Сравнение товаров</h1>
            {products.length > 0 && (
              <button onClick={clearAll} className="text-sm text-danger hover:underline">Очистить все</button>
            )}
          </div>

          {loading && <p className="text-text-gray text-center py-8">Загрузка...</p>}

          {!loading && products.length === 0 && (
            <div className="bg-bg-white rounded-xl border border-border p-8 text-center">
              <p className="text-text-gray mb-4">Нет товаров для сравнения</p>
              <Link href="/catalog" className="inline-block bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary-dark font-medium">В каталог</Link>
            </div>
          )}

          {!loading && products.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full bg-bg-white rounded-xl border border-border">
                <thead>
                  <tr>
                    <th className="text-left p-4 text-text-gray text-sm font-medium border-b border-border min-w-[120px]">Параметр</th>
                    {products.map((p) => (
                      <th key={p.id} className="p-4 border-b border-border min-w-[180px]">
                        <div className="text-center">
                          <div className="w-20 h-20 mx-auto bg-bg-light rounded-lg mb-2 flex items-center justify-center text-2xl">
                            {p.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.image} alt={p.name} className="w-full h-full object-contain p-1" />
                            ) : "📦"}
                          </div>
                          <Link href={`/product/${p.slug}`} className="text-sm font-medium text-text-dark hover:text-primary line-clamp-2">{p.name}</Link>
                          <button onClick={() => removeFromCompare(p.id)} className="text-xs text-danger hover:underline mt-1 block mx-auto">Убрать</button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Цена", render: (p: Product) => <span className="font-bold text-primary">{p.price.toLocaleString("ru-RU")} ₽</span> },
                    { label: "Старая цена", render: (p: Product) => p.oldPrice ? <span className="line-through text-text-light">{p.oldPrice.toLocaleString("ru-RU")} ₽</span> : "—" },
                    { label: "Наличие", render: (p: Product) => p.inStock > 0 ? <span className="text-success">{p.inStock} шт.</span> : <span className="text-danger">Нет</span> },
                    { label: "Бренд", render: (p: Product) => p.brand || "—" },
                    { label: "Тип", render: (p: Product) => p.productType || "—" },
                    { label: "Цвет", render: (p: Product) => p.color || "—" },
                    { label: "Категория", render: (p: Product) => p.category?.name || "—" },
                  ].map((row) => (
                    <tr key={row.label} className="border-b border-border/50">
                      <td className="p-4 text-sm text-text-gray font-medium">{row.label}</td>
                      {products.map((p) => (
                        <td key={p.id} className="p-4 text-sm text-text-dark text-center">{row.render(p)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
