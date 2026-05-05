import Link from "next/link";

const PER_PAGE = 16;

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  baseParams: Record<string, string | undefined>;
}

export { PER_PAGE };

export default function Pagination({ currentPage, totalItems, baseParams }: PaginationProps) {
  const totalPages = Math.ceil(totalItems / PER_PAGE);
  if (totalPages <= 1) return null;

  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(baseParams)) {
    if (v && k !== "page") params.set(k, v);
  }

  const makeHref = (page: number) => {
    const p = new URLSearchParams(params);
    if (page > 1) p.set("page", String(page));
    const qs = p.toString();
    return qs ? `?${qs}` : "?";
  };

  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <nav className="flex items-center justify-center gap-0.5 sm:gap-1 mt-6 sm:mt-8 flex-wrap">
      {currentPage > 1 && (
        <Link href={makeHref(currentPage - 1)} className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm text-text-gray hover:bg-bg-light transition-colors">
          &larr; <span className="hidden sm:inline">Назад</span>
        </Link>
      )}
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="px-1 sm:px-2 py-1.5 sm:py-2 text-text-light text-xs sm:text-sm">...</span>
        ) : (
          <Link
            key={p}
            href={makeHref(p)}
            className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-colors ${
              p === currentPage
                ? "bg-primary text-white font-medium"
                : "text-text-gray hover:bg-bg-light"
            }`}
          >
            {p}
          </Link>
        )
      )}
      {currentPage < totalPages && (
        <Link href={makeHref(currentPage + 1)} className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm text-text-gray hover:bg-bg-light transition-colors">
          <span className="hidden sm:inline">Вперёд</span> &rarr;
        </Link>
      )}
    </nav>
  );
}
