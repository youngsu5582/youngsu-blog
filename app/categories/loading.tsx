export default function CategoriesLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-9 w-40 bg-muted rounded animate-pulse" />
          <div className="h-4 w-56 bg-muted rounded animate-pulse mt-3" />
        </div>
        <div className="h-9 w-24 bg-muted rounded animate-pulse" />
      </div>

      {/* Quick navigation skeleton */}
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-8 bg-muted rounded-full animate-pulse"
            style={{ width: `${60 + (i * 12)}px` }}
          />
        ))}
      </div>

      {/* Category cards skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-border/60 overflow-hidden"
          >
            {/* Parent category */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-card">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                <div className="h-5 w-32 bg-muted rounded animate-pulse" />
              </div>
              <div className="h-5 w-8 bg-muted rounded-full animate-pulse" />
            </div>

            {/* Child categories (vary count to match real variety) */}
            {i <= 3 && (
              <div className="border-t border-border/40">
                {Array.from({ length: Math.min(i + 2, 5) }).map((_, j) => (
                  <div
                    key={j}
                    className="flex items-center justify-between px-5 py-2.5 pl-12 border-b border-border/20 last:border-b-0"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-muted rounded animate-pulse" />
                      <div className="h-4 w-28 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="h-3 w-6 bg-muted rounded animate-pulse" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
