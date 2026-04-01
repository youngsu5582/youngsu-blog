export default function PostsLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-9 w-32 bg-muted rounded animate-pulse" />
          <div className="h-4 w-48 bg-muted rounded animate-pulse mt-3" />
        </div>
        <div className="h-9 w-24 bg-muted rounded animate-pulse" />
      </div>

      {/* Post cards skeleton */}
      <div className="grid gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <article key={i} className="py-6 first:pt-0">
            <div className="flex gap-5">
              {/* Content */}
              <div className="flex-1 min-w-0 space-y-2.5">
                {/* Category badges */}
                <div className="flex gap-2">
                  <div className="h-5 w-20 bg-muted rounded animate-pulse" />
                  <div className="h-5 w-16 bg-muted rounded animate-pulse" />
                </div>

                {/* Title */}
                <div className="h-7 w-3/4 bg-muted rounded animate-pulse" />

                {/* Description */}
                <div className="space-y-2">
                  <div className="h-4 w-full bg-muted rounded animate-pulse" />
                  <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
                </div>

                {/* Meta + Tags */}
                <div className="flex items-center gap-4 pt-1">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="h-3 w-px bg-muted" />
                  <div className="flex gap-1.5">
                    <div className="h-5 w-12 bg-muted rounded-full animate-pulse" />
                    <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
                    <div className="h-5 w-14 bg-muted rounded-full animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Thumbnail (show on alternating items to match real variety) */}
              {i % 2 === 0 && (
                <div className="flex-shrink-0">
                  <div className="w-48 h-28 rounded-lg bg-muted animate-pulse" />
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-center gap-2">
        <div className="h-9 w-20 bg-muted rounded animate-pulse" />
        <div className="h-4 w-16 bg-muted rounded animate-pulse" />
        <div className="h-9 w-20 bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}
