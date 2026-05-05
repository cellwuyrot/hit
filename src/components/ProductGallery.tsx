"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";

interface ProductGalleryProps {
  images: string[];
  name: string;
  discount: number;
}

export default function ProductGallery({ images, name, discount }: ProductGalleryProps) {
  const [selected, setSelected] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imgRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  }, []);

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
    <>
      <div className="bg-bg-white rounded-xl border border-border p-4">
        <div
          ref={imgRef}
          className="relative aspect-square mb-3 cursor-zoom-in overflow-hidden rounded-lg"
          onClick={() => setLightbox(true)}
          onMouseEnter={() => setZoomed(true)}
          onMouseLeave={() => setZoomed(false)}
          onMouseMove={handleMouseMove}
        >
          <Image
            src={images[selected]}
            alt={name}
            fill
            className="object-contain p-4 transition-transform duration-300"
            style={zoomed ? { transform: `scale(2)`, transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
          />
          {discount > 0 && (
            <span className="absolute top-4 left-4 bg-danger text-white text-sm font-bold px-3 py-1 rounded-lg z-10">
              -{discount}%
            </span>
          )}
          <div className="absolute bottom-3 right-3 bg-black/50 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity z-10">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </div>
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 justify-center">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg border-2 overflow-hidden transition-all ${selected === i ? "border-primary shadow-md" : "border-border hover:border-primary/50"}`}
              >
                <Image src={img} alt={`${name} ${i + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center lightbox-overlay"
          onClick={() => setLightbox(false)}
        >
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 z-50"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setSelected((selected - 1 + images.length) % images.length); }}
                className="absolute left-4 text-white/80 hover:text-white p-2 z-50"
              >
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setSelected((selected + 1) % images.length); }}
                className="absolute right-4 text-white/80 hover:text-white p-2 z-50"
              >
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          <div className="relative w-full h-full max-w-4xl max-h-[80vh] m-8" onClick={(e) => e.stopPropagation()}>
            <Image src={images[selected]} alt={name} fill className="object-contain" />
          </div>

          {images.length > 1 && (
            <div className="absolute bottom-6 flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setSelected(i); }}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${selected === i ? "bg-white" : "bg-white/40"}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
