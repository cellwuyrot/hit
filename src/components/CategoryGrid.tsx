"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useInlineEdit } from "./InlineEditContext";
import InlineEditable from "./InlineEditable";

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

async function saveOrder(orderedIds: string[]) {
  const token = localStorage.getItem("admin_token");
  const res = await fetch("/api/admin/inline", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ model: "category", orderedIds }),
  });
  if (!res.ok) throw new Error("Reorder failed");
}

export default function CategoryGrid({ categories: initialCategories }: { categories: CategoryItem[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const { editing } = useInlineEdit();
  const [categories, setCategories] = useState(initialCategories);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);

  const toggle = (id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    dragItem.current = index;
    setDragIdx(index);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverIdx(index);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      const fromIndex = dragItem.current;
      if (fromIndex === null || fromIndex === dropIndex) {
        setDragIdx(null);
        setOverIdx(null);
        return;
      }

      const newItems = [...categories];
      const [moved] = newItems.splice(fromIndex, 1);
      newItems.splice(dropIndex, 0, moved);
      setCategories(newItems);
      setDragIdx(null);
      setOverIdx(null);
      dragItem.current = null;

      try {
        await saveOrder(newItems.map((c) => c.id));
      } catch {
        setCategories(initialCategories);
      }
    },
    [categories, initialCategories]
  );

  const handleDragEnd = useCallback(() => {
    setDragIdx(null);
    setOverIdx(null);
    dragItem.current = null;
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
      {categories.map((cat, index) => (
        <div
          key={cat.id}
          className={`relative ${editing ? "transition-all duration-150" : ""} ${
            editing && dragIdx === index ? "opacity-40 scale-95" : ""
          } ${editing && overIdx === index && dragIdx !== index ? "ring-2 ring-primary ring-offset-2 rounded-lg" : ""}`}
          draggable={editing}
          onDragStart={editing ? (e) => handleDragStart(e, index) : undefined}
          onDragOver={editing ? (e) => handleDragOver(e, index) : undefined}
          onDrop={editing ? (e) => handleDrop(e, index) : undefined}
          onDragEnd={editing ? handleDragEnd : undefined}
        >
          {editing && (
            <div className="absolute -left-1 -top-1 z-10 cursor-grab active:cursor-grabbing bg-primary/90 text-white rounded-md p-0.5 opacity-60 hover:opacity-100 transition-opacity shadow-md">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            </div>
          )}
          <div className="bg-bg-white rounded-xl border border-border p-3 sm:p-6 hover:shadow-lg hover:border-primary/30 transition-all group">
            {editing ? (
              <div>
                <div className="mb-2 sm:mb-3 flex justify-center">
                  {cat.icon && (cat.icon.startsWith("/") || cat.icon.startsWith("http")) ? (
                    <img src={cat.icon} alt={cat.name} className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg" style={{ maxWidth: 256, maxHeight: 256 }} />
                  ) : (
                    <span className="text-2xl sm:text-3xl">{cat.icon || "📦"}</span>
                  )}
                </div>
                <InlineEditable
                  model="category"
                  id={cat.id}
                  field="name"
                  value={cat.name}
                  as="h3"
                  className="font-medium text-text-dark text-center text-sm sm:text-base"
                />
              </div>
            ) : (
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
            )}
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
                  href={`/catalog/${cat.slug}/${sub.slug}`}
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
