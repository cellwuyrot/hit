export function SkeletonCard() {
  return (
    <div className="bg-bg-white rounded-xl border border-border p-3 sm:p-4 flex flex-col">
      <div className="skeleton aspect-square mb-2 sm:mb-3" />
      <div className="skeleton h-4 mb-2 w-3/4" />
      <div className="skeleton h-3 mb-2 w-1/2" />
      <div className="skeleton h-5 mb-3 w-1/3" />
      <div className="skeleton h-9 w-full" />
    </div>
  );
}

export function SkeletonProductGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonLine({ width = "w-full", height = "h-4" }: { width?: string; height?: string }) {
  return <div className={`skeleton ${width} ${height}`} />;
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`skeleton h-4 ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}

export function SkeletonProductDetail() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
      <div className="bg-bg-white rounded-xl border border-border p-4">
        <div className="skeleton aspect-square" />
      </div>
      <div className="space-y-4">
        <div className="skeleton h-8 w-3/4" />
        <div className="skeleton h-5 w-1/4" />
        <div className="skeleton h-10 w-1/3" />
        <div className="space-y-2">
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-2/3" />
        </div>
        <div className="skeleton h-12 w-full" />
      </div>
    </div>
  );
}
