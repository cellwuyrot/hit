"use client";

import { useState, useEffect, startTransition } from "react";

export default function CompareButton({ productId, productName }: { productId: string; productName: string }) {
  const [inCompare, setInCompare] = useState(false);

  useEffect(() => {
    const list: { id: string }[] = JSON.parse(localStorage.getItem("compare") || "[]");
    startTransition(() => setInCompare(list.some((p) => p.id === productId)));
  }, [productId]);

  const toggle = () => {
    const list: { id: string; name: string }[] = JSON.parse(localStorage.getItem("compare") || "[]");
    if (inCompare) {
      const filtered = list.filter((p) => p.id !== productId);
      localStorage.setItem("compare", JSON.stringify(filtered));
      setInCompare(false);
    } else {
      list.push({ id: productId, name: productName });
      localStorage.setItem("compare", JSON.stringify(list));
      setInCompare(true);
    }
  };

  return (
    <button onClick={toggle}
      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium border transition-colors ${
        inCompare ? "border-primary bg-primary/5 text-primary" : "border-border text-text-gray hover:text-primary hover:border-primary"
      }`}>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      {inCompare ? "В сравнении" : "Сравнить"}
    </button>
  );
}
