"use client";

export function SkeletonCard() {
  return (
    <div className="bg-bg-white rounded-xl border border-border p-3 sm:p-4 animate-fade-in">
      <div className="skeleton w-full aspect-square mb-3" />
      <div className="skeleton h-4 w-3/4 mb-2" />
      <div className="skeleton h-3 w-1/2 mb-3" />
      <div className="skeleton h-5 w-1/3 mb-3" />
      <div className="skeleton h-10 w-full rounded-lg" />
    </div>
  );
}

export function SkeletonProductGrid({ count = 8 }: { count?: number }) {
  return <SkeletonGrid count={count} />;
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonProductPage() {
  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 animate-fade-in">
      <div className="skeleton h-4 w-64 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
        <div className="skeleton aspect-square rounded-xl" />
        <div>
          <div className="skeleton h-8 w-3/4 mb-3" />
          <div className="skeleton h-4 w-1/3 mb-4" />
          <div className="skeleton h-10 w-1/2 mb-4" />
          <div className="skeleton h-4 w-full mb-2" />
          <div className="skeleton h-4 w-5/6 mb-2" />
          <div className="skeleton h-4 w-2/3 mb-6" />
          <div className="skeleton h-12 w-full rounded-lg mb-3" />
          <div className="skeleton h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-4 mb-2"
          style={{ width: `${85 - i * 15}%` }}
        />
      ))}
    </div>
  );
}
