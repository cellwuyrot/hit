"use client";

import { useState, useCallback } from "react";

interface RippleItem {
  x: number;
  y: number;
  id: number;
}

export default function Ripple() {
  const [ripples, setRipples] = useState<RippleItem[]>([]);

  const addRipple = useCallback((e: React.MouseEvent<HTMLSpanElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples((prev) => [...prev, { x, y, id }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
  }, []);

  return (
    <span
      className="absolute inset-0 overflow-hidden rounded-[inherit]"
      onMouseDown={addRipple}
    >
      {ripples.map((r) => (
        <span
          key={r.id}
          className="absolute rounded-full bg-current opacity-20 animate-ripple pointer-events-none"
          style={{
            left: r.x - 50,
            top: r.y - 50,
            width: 100,
            height: 100,
          }}
        />
      ))}
    </span>
  );
}
