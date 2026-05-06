"use client";

import { useState } from "react";
import Link from "next/link";

interface SubCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  icon: string;
  children: SubCategory[];
  _count: { products: number };
}

export default function CategoryGrid({ categories }: { categories: CategoryItem[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
      {categories.map((cat) => (
        <div key={cat.id} className="relative">
          <div className="bg-bg-white rounded-xl border border-border p-3 sm:p-6 hover:shadow-lg hover:border-primary/30 transition-all group">
            <Link href={`/catalog/${cat.slug}`}>
              <div className="mb-2 sm:mb-3 flex justify-center">
                {cat.icon && (cat.icon.startsWith("/") || cat.icon.startsWith("http")) ? (
                  <img src={cat.icon} alt={cat.name} className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg" style={{ maxWidth: 256, maxHeight: 256 }} />
                ) : (
                  <span className="text-2xl sm:text-3xl">{cat.icon || "📦"}</span>
                )}
              </div>
              <h3 className="font-medium text-text-dark text-center text-sm sm:text-base group-hover:text-primary transition-colors">{cat.name}</h3>
            </Link>
            {cat.children.length > 0 && (
              <button
                onClick={() => toggle(cat.id)}
                className="mt-1.5 sm:mt-2 w-full flex items-center justify-center gap-1 text-[10px] sm:text-xs text-text-gray hover:text-primary transition-colors"
              >
                <span>{cat.children.length} подкатегорий</span>
                <svg
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-200 ${expanded === cat.id ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
          {expanded === cat.id && cat.children.length > 0 && (
            <div className="mt-1 bg-bg-white rounded-lg border border-border shadow-lg overflow-hidden z-10 relative animate-fade-in">
              {cat.children.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/catalog/${sub.slug}`}
                  className="block px-3 py-2 text-xs sm:text-sm text-text-dark hover:bg-primary/5 hover:text-primary transition-colors border-b border-border/30 last:border-0"
                >
                  {sub.icon && !(sub.icon.startsWith("/") || sub.icon.startsWith("http")) && (
                    <span className="mr-1.5">{sub.icon}</span>
                  )}
                  {sub.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
