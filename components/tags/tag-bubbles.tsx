"use client";

import Link from "next/link";

interface TagData {
  name: string;
  count: number;
}

function getSize(count: number, maxCount: number): string {
  const ratio = count / maxCount;
  if (ratio > 0.6) return "text-base px-5 py-2.5 font-semibold";
  if (ratio > 0.3) return "text-sm px-4 py-2 font-medium";
  return "text-xs px-3 py-1.5";
}

export function TagBubbles({ tags }: { tags: TagData[] }) {
  const maxCount = tags.length > 0 ? Math.max(...tags.map((t) => t.count)) : 1;

  return (
    <div className="flex flex-wrap gap-2.5 items-center justify-center py-4">
      {tags.map((tag) => (
        <Link
          key={tag.name}
          href={`/tags/${encodeURIComponent(tag.name)}`}
          className={`
            theme-tag rounded-full inline-flex items-center gap-1.5
            hover:scale-105 active:scale-95
            transition-all duration-200
            ${getSize(tag.count, maxCount)}
          `}
        >
          <span>#{tag.name}</span>
          <span className="opacity-50 text-[0.8em]">{tag.count}</span>
        </Link>
      ))}
    </div>
  );
}
