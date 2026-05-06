"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface MobileFilterDrawerProps {
  brands: string[];
  productTypes: string[];
  colors: string[];
  minPrice: number;
  maxPrice: number;
}

export default function MobileFilterDrawer({
  brands,
  productTypes,
  colors,
  minPrice,
  maxPrice,
}: MobileFilterDrawerProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [priceFrom, setPriceFrom] = useState(Number(searchParams.get("priceFrom")) || minPrice);
  const [priceTo, setPriceTo] = useState(Number(searchParams.get("priceTo")) || maxPrice);
  const [displayPriceTo, setDisplayPriceTo] = useState(Number(searchParams.get("priceTo")) || maxPrice);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRangeChange = useCallback((value: number) => {
    setDisplayPriceTo(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setPriceTo(value), 150);
  }, []);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(searchParams.get("brands")?.split(",").filter(Boolean) || []);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(searchParams.get("types")?.split(",").filter(Boolean) || []);
  const [selectedColors, setSelectedColors] = useState<string[]>(searchParams.get("colors")?.split(",").filter(Boolean) || []);

  const activeCount = (selectedBrands.length > 0 ? 1 : 0) + (selectedTypes.length > 0 ? 1 : 0) + (selectedColors.length > 0 ? 1 : 0) + (priceFrom > minPrice || priceTo < maxPrice ? 1 : 0);

  const toggle = (value: string, selected: string[], set: (v: string[]) => void) => {
    set(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  const apply = () => {
    const params = new URLSearchParams();
    if (priceFrom > minPrice) params.set("priceFrom", String(priceFrom));
    if (priceTo < maxPrice) params.set("priceTo", String(priceTo));
    if (selectedBrands.length > 0) params.set("brands", selectedBrands.join(","));
    if (selectedTypes.length > 0) params.set("types", selectedTypes.join(","));
    if (selectedColors.length > 0) params.set("colors", selectedColors.join(","));
    const sort = searchParams.get("sort");
    if (sort) params.set("sort", sort);
    router.push(`?${params.toString()}`);
    setOpen(false);
  };

  const reset = () => {
    setPriceFrom(minPrice);
    setPriceTo(maxPrice);
    setSelectedBrands([]);
    setSelectedTypes([]);
    setSelectedColors([]);
    router.push("?");
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden flex items-center gap-2 px-4 py-2 bg-bg-white border border-border rounded-lg text-sm text-text-dark hover:border-primary transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Фильтры
        {activeCount > 0 && (
          <span className="bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{activeCount}</span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white animate-slide-in-right overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-border px-4 py-3 flex items-center justify-between z-10">
              <h3 className="font-heading font-bold text-text-dark">Фильтры</h3>
              <button onClick={() => setOpen(false)} className="text-text-gray hover:text-text-dark p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-5">
              {/* Price */}
              <div>
                <h4 className="text-sm font-medium text-text-dark mb-2">Цена</h4>
                <div className="flex items-center gap-2 mb-2">
                  <input type="number" value={priceFrom} onChange={(e) => setPriceFrom(Number(e.target.value))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="От" />
                  <span className="text-text-gray">—</span>
                  <input type="number" value={priceTo} onChange={(e) => setPriceTo(Number(e.target.value))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="До" />
                </div>
                <input type="range" min={minPrice} max={maxPrice} value={displayPriceTo}
                  onChange={(e) => handleRangeChange(Number(e.target.value))} className="w-full accent-primary" />
              </div>

              {/* Product types */}
              {productTypes.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-text-dark mb-2">Тип товара</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {productTypes.map((type) => (
                      <label key={type} className="flex items-center gap-2 text-sm text-text-gray">
                        <input type="checkbox" checked={selectedTypes.includes(type)}
                          onChange={() => toggle(type, selectedTypes, setSelectedTypes)} className="accent-primary rounded" />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Brands */}
              {brands.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-text-dark mb-2">Бренд</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {brands.map((brand) => (
                      <label key={brand} className="flex items-center gap-2 text-sm text-text-gray">
                        <input type="checkbox" checked={selectedBrands.includes(brand)}
                          onChange={() => toggle(brand, selectedBrands, setSelectedBrands)} className="accent-primary rounded" />
                        {brand}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              {colors.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-text-dark mb-2">Цвет</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {colors.map((color) => (
                      <label key={color} className="flex items-center gap-2 text-sm text-text-gray">
                        <input type="checkbox" checked={selectedColors.includes(color)}
                          onChange={() => toggle(color, selectedColors, setSelectedColors)} className="accent-primary rounded" />
                        {color}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-border px-4 py-3 flex gap-3">
              <button onClick={reset} className="flex-1 py-2.5 text-sm text-text-gray border border-border rounded-lg hover:text-text-dark transition-colors">
                Сбросить
              </button>
              <button onClick={apply} className="flex-1 py-2.5 text-sm text-white bg-primary hover:bg-primary-dark rounded-lg font-medium transition-colors">
                Применить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
