"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useInlineEdit } from "./InlineEditContext";
import InlineEditable from "./InlineEditable";

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

async function saveSlideOrder(orderedIds: string[]) {
  const token = localStorage.getItem("admin_token");
  const res = await fetch("/api/admin/inline", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ model: "slider", orderedIds }),
  });
  if (!res.ok) throw new Error("Reorder failed");
}

export default function HeroSlider({ slides: initialSlides }: HeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);
  const { editing } = useInlineEdit();
  const [slides, setSlides] = useState(initialSlides);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1 || editing) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, slides.length, editing]);

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

  const handleThumbDragStart = useCallback((e: React.DragEvent, index: number) => {
    dragItem.current = index;
    setDragIdx(index);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleThumbDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setOverIdx(index);
  }, []);

  const handleThumbDrop = useCallback(
    async (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      const fromIndex = dragItem.current;
      if (fromIndex === null || fromIndex === dropIndex) {
        setDragIdx(null);
        setOverIdx(null);
        return;
      }
      const newSlides = [...slides];
      const [moved] = newSlides.splice(fromIndex, 1);
      newSlides.splice(dropIndex, 0, moved);
      setSlides(newSlides);
      setDragIdx(null);
      setOverIdx(null);
      dragItem.current = null;

      try {
        await saveSlideOrder(newSlides.map((s) => s.id));
      } catch {
        setSlides(initialSlides);
      }
    },
    [slides, initialSlides]
  );

  const handleThumbDragEnd = useCallback(() => {
    setDragIdx(null);
    setOverIdx(null);
    dragItem.current = null;
  }, []);

  if (slides.length === 0) {
    return (
      <div className="bg-primary/10 rounded-xl h-48 md:h-80 flex items-center justify-center">
        <p className="text-text-gray text-lg">Добавьте слайды в админ-панели</p>
      </div>
    );
  }

  return (
    <div>
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
                  alt={slide.title ? `${slide.title} — акция ТОПХИТ` : `Баннер ${index + 1} — товары оптом и в розницу ТОПХИТ`}
                  className="absolute inset-0 w-full h-full object-cover"
                  fetchPriority={index === 0 ? "high" : undefined}
                  loading={index === 0 ? "eager" : "lazy"}
                />
                {(slide.title || slide.subtitle) && !editing && (
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
              {editing && (
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent flex items-center pointer-events-auto">
                  <div className="px-4 sm:px-8 md:px-16 pointer-events-auto">
                    <InlineEditable
                      model="slider"
                      id={slide.id}
                      field="title"
                      value={slide.title}
                      as="h2"
                      className="text-white text-lg sm:text-2xl md:text-4xl font-bold mb-1 sm:mb-2"
                    />
                    <InlineEditable
                      model="slider"
                      id={slide.id}
                      field="subtitle"
                      value={slide.subtitle}
                      as="p"
                      className="text-white/80 text-sm sm:text-lg md:text-xl"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Предыдущий слайд"
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 sm:p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg className="w-5 h-5 text-text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={next}
              aria-label="Следующий слайд"
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
                  aria-label={`Слайд ${index + 1}`}
                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-colors shadow-sm ${
                    index === current ? "bg-white border-2 border-gray-700" : "bg-gray-800/70 border border-gray-600"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {editing && slides.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              draggable
              onDragStart={(e) => handleThumbDragStart(e, index)}
              onDragOver={(e) => handleThumbDragOver(e, index)}
              onDrop={(e) => handleThumbDrop(e, index)}
              onDragEnd={handleThumbDragEnd}
              onClick={() => setCurrent(index)}
              className={`relative flex-shrink-0 w-24 h-14 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                current === index ? "border-primary" : "border-transparent"
              } ${dragIdx === index ? "opacity-40 scale-90" : ""} ${
                overIdx === index && dragIdx !== index ? "ring-2 ring-primary" : ""
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveImageUrl(slide.imageUrl)}
                alt={`Слайд ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-0 left-0 bg-primary/80 text-white text-[9px] px-1 rounded-br cursor-grab active:cursor-grabbing">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
