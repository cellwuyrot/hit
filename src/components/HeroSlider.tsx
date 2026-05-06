"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  link: string;
}

interface HeroSliderProps {
  slides: Slide[];
}

function resolveImageUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/api/")) return url;
  return `/api/static${url.startsWith("/") ? url : `/${url}`}`;
}

export default function HeroSlider({ slides }: HeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, slides.length]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    if (Math.abs(distance) > 50) {
      if (distance > 0) next();
      else prev();
    }
    touchStart.current = null;
    touchEnd.current = null;
  };

  if (slides.length === 0) {
    return (
      <div className="bg-primary/10 rounded-xl h-48 md:h-80 flex items-center justify-center">
        <p className="text-text-gray text-lg">Добавьте слайды в админ-панели</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden group" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div className="relative aspect-[2/1] sm:aspect-[2.5/1] md:aspect-[3/1] lg:aspect-[3.5/1]">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === current ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <Link href={slide.link || "#"}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveImageUrl(slide.imageUrl)}
                alt={slide.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {(slide.title || slide.subtitle) && (
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent flex items-center">
                  <div className="px-4 sm:px-8 md:px-16">
                    {slide.title && (
                      <h2 className="text-white text-lg sm:text-2xl md:text-4xl font-bold mb-1 sm:mb-2">{slide.title}</h2>
                    )}
                    {slide.subtitle && (
                      <p className="text-white/80 text-sm sm:text-lg md:text-xl">{slide.subtitle}</p>
                    )}
                  </div>
                </div>
              )}
            </Link>
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 sm:p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <svg className="w-5 h-5 text-text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 sm:p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <svg className="w-5 h-5 text-text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrent(index)}
                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-colors shadow-sm ${
                  index === current ? "bg-white border-2 border-gray-700" : "bg-gray-800/70 border border-gray-600"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
