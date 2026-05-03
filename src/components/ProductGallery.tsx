"use client";

import { useState } from "react";
import Image from "next/image";

interface ProductGalleryProps {
  images: string[];
  name: string;
  discount: number;
}

export default function ProductGallery({ images, name, discount }: ProductGalleryProps) {
  const [selected, setSelected] = useState(0);

  if (images.length === 0) {
    return (
      <div className="bg-bg-white rounded-xl border border-border p-4">
        <div className="relative aspect-square flex items-center justify-center text-text-light">
          <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-white rounded-xl border border-border p-4">
      <div className="relative aspect-square mb-3">
        <Image src={images[selected]} alt={name} fill className="object-contain p-4" />
        {discount > 0 && (
          <span className="absolute top-4 left-4 bg-danger text-white text-sm font-bold px-3 py-1 rounded-lg">
            -{discount}%
          </span>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 justify-center">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`relative w-16 h-16 rounded-lg border-2 overflow-hidden transition-colors ${selected === i ? "border-primary" : "border-border hover:border-primary/50"}`}
            >
              <Image src={img} alt={`${name} ${i + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
