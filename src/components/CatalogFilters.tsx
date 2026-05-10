"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface FiltersProps {
  brands: string[];
  productTypes: string[];
  colors: string[];
  minPrice: number;
  maxPrice: number;
}

function FilterSection({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-5">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-sm font-medium text-text-dark mb-2 hover:text-primary transition-colors"
      >
        {title}
        <svg
          className={`w-4 h-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          open ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export default function CatalogFilters({
  brands,
  productTypes,
  colors,
  minPrice,
  maxPrice,
}: FiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [priceFrom, setPriceFrom] = useState(
    Number(searchParams.get("priceFrom")) || minPrice
  );
  const [priceTo, setPriceTo] = useState(
    Number(searchParams.get("priceTo")) || maxPrice
  );
  const [displayPriceTo, setDisplayPriceTo] = useState(priceTo);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRangeChange = useCallback((value: number) => {
    setDisplayPriceTo(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setPriceTo(value), 150);
  }, []);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    searchParams.get("brands")?.split(",").filter(Boolean) || []
  );
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    searchParams.get("types")?.split(",").filter(Boolean) || []
  );
  const [selectedColors, setSelectedColors] = useState<string[]>(
    searchParams.get("colors")?.split(",").filter(Boolean) || []
  );

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (priceFrom > minPrice) params.set("priceFrom", String(priceFrom));
    if (priceTo < maxPrice) params.set("priceTo", String(priceTo));
    if (selectedBrands.length > 0) params.set("brands", selectedBrands.join(","));
    if (selectedTypes.length > 0) params.set("types", selectedTypes.join(","));
    if (selectedColors.length > 0) params.set("colors", selectedColors.join(","));
    const sort = searchParams.get("sort");
    if (sort) params.set("sort", sort);
    const query = params.toString();
    router.push(`?${query}`);
  };

  const resetFilters = () => {
    setPriceFrom(minPrice);
    setPriceTo(maxPrice);
    setSelectedBrands([]);
    setSelectedTypes([]);
    setSelectedColors([]);
    router.push("?");
  };

  const toggleFilter = (
    value: string,
    selected: string[],
    setSelected: (v: string[]) => void
  ) => {
    setSelected(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    );
  };

  return (
    <aside className="bg-bg-white rounded-xl border border-border p-5">
      <h3 className="font-bold text-text-dark mb-4">Фильтр по параметрам</h3>

      {/* Price range */}
      <FilterSection title="Розничная" defaultOpen={true}>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="number"
            value={priceFrom}
            onChange={(e) => setPriceFrom(Number(e.target.value))}
            className="w-full border border-border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:border-primary"
          />
          <span className="text-text-gray">—</span>
          <input
            type="number"
            value={priceTo}
            onChange={(e) => setPriceTo(Number(e.target.value))}
            className="w-full border border-border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <input
          type="range"
          min={minPrice}
          max={maxPrice}
          value={displayPriceTo}
          onChange={(e) => handleRangeChange(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-text-light">
          <span>{minPrice.toLocaleString("ru-RU")}</span>
          <span>{maxPrice.toLocaleString("ru-RU")}</span>
        </div>
      </FilterSection>

      {/* Product types */}
      {productTypes.length > 0 && (
        <FilterSection title="Тип товара">
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {productTypes.map((type) => (
              <label key={type} className="flex items-center gap-2 text-sm text-text-gray cursor-pointer hover:text-text-dark transition-colors">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type)}
                  onChange={() => toggleFilter(type, selectedTypes, setSelectedTypes)}
                  className="accent-primary rounded"
                />
                {type}
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Brands */}
      {brands.length > 0 && (
        <FilterSection title="Бренд">
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {brands.map((brand) => (
              <label key={brand} className="flex items-center gap-2 text-sm text-text-gray cursor-pointer hover:text-text-dark transition-colors">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={() => toggleFilter(brand, selectedBrands, setSelectedBrands)}
                  className="accent-primary rounded"
                />
                {brand}
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Colors */}
      {colors.length > 0 && (
        <FilterSection title="Цвет / База">
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {colors.map((color) => (
              <label key={color} className="flex items-center gap-2 text-sm text-text-gray cursor-pointer hover:text-text-dark transition-colors">
                <input
                  type="checkbox"
                  checked={selectedColors.includes(color)}
                  onChange={() => toggleFilter(color, selectedColors, setSelectedColors)}
                  className="accent-primary rounded"
                />
                {color}
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        <button
          onClick={applyFilters}
          className="w-full bg-primary hover:bg-primary-dark text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
        >
          Применить
        </button>
        <button
          onClick={resetFilters}
          className="w-full text-text-gray hover:text-text-dark text-sm py-2 transition-colors"
        >
          Сбросить
        </button>
      </div>
    </aside>
  );
}
