export default function NotesLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div>
        <div className="h-9 w-40 bg-muted rounded animate-pulse" />
        <div className="h-4 w-64 bg-muted rounded animate-pulse mt-3" />
      </div>

      {/* Controls skeleton */}
      <div className="flex items-center justify-between gap-3">
        {/* Search bar */}
        <div className="flex-1 max-w-sm h-10 bg-muted rounded-md animate-pulse" />

        {/* View toggle */}
        <div className="flex gap-1 border border-border rounded-lg p-0.5">
          <div className="h-8 w-8 bg-muted rounded-md animate-pulse" />
          <div className="h-8 w-8 bg-muted rounded-md animate-pulse" />
          <div className="h-8 w-8 bg-muted rounded-md animate-pulse" />
        </div>
      </div>

      {/* Category + Tag filters skeleton */}
      <div className="flex flex-wrap gap-1.5">
        <div className="h-6 w-12 bg-muted rounded-full animate-pulse" />
        <div className="h-6 w-20 bg-muted rounded-full animate-pulse" />
        <div className="h-6 w-24 bg-muted rounded-full animate-pulse" />
        <div className="h-6 w-16 bg-muted rounded-full animate-pulse" />
        <div className="h-6 w-28 bg-muted rounded-full animate-pulse" />
        <div className="h-6 w-18 bg-muted rounded-full animate-pulse" />
      </div>

      {/* Notes list skeleton */}
      <div className="space-y-1">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="rounded-lg border border-border/40 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              {/* Chevron icon placeholder */}
              <div className="h-3.5 w-3.5 bg-muted rounded animate-pulse flex-shrink-0" />

              {/* Date */}
              <div className="w-20 h-3 bg-muted rounded animate-pulse flex-shrink-0" />

              {/* Title */}
              <div className="flex-1 h-4 bg-muted rounded animate-pulse" />

              {/* Categories and tags */}
              <div className="flex gap-1.5 flex-shrink-0">
                <div className="h-3 w-12 bg-muted rounded animate-pulse" />
                <div className="h-3 w-16 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
