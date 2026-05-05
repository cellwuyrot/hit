"use client";

import { useEffect } from "react";

export default function CategoryTracker({ categoryId }: { categoryId: string }) {
  useEffect(() => {
    if (!categoryId) return;
    const stored: string[] = JSON.parse(localStorage.getItem("viewed_categories") || "[]");
    if (!stored.includes(categoryId)) {
      const updated = [categoryId, ...stored].slice(0, 10);
      localStorage.setItem("viewed_categories", JSON.stringify(updated));
    }
  }, [categoryId]);
  return null;
}
