"use client";

import Link from "next/link";
import { getTagColorClass } from "@/lib/category-colors";

interface TagData {
  name: string;
  count: number;
}

function getSize(count: number): string {
  if (count >= 6) return "text-lg px-5 py-2.5 font-semibold";
  if (count >= 4) return "text-base px-4 py-2 font-medium";
  if (count >= 2) return "text-sm px-3.5 py-1.5 font-medium";
  return "text-xs px-3 py-1.5";
}

// 태그 이름 기반 deterministic shuffle을 위한 시드 함수
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function TagBubbles({ tags }: { tags: TagData[] }) {
  // 태그 이름 기반으로 deterministic하게 섞기
  const shuffledTags = [...tags].sort((a, b) => {
    const hashA = hashString(a.name);
    const hashB = hashString(b.name);
    return hashA - hashB;
  });

  return (
    <div className="flex flex-wrap gap-2.5 items-center justify-center py-4">
      {shuffledTags.map((tag) => {
        const colorClass = getTagColorClass(tag.name);
        const baseClass = colorClass || "theme-tag";

        return (
          <Link
            key={tag.name}
            href={`/tags/${encodeURIComponent(tag.name)}`}
            className={`
              ${baseClass}
              rounded-full inline-flex items-center gap-1.5
              hover:scale-105 active:scale-95
              transition-all duration-200
              ${colorClass ? "border backdrop-filter backdrop-blur-sm" : ""}
              ${getSize(tag.count)}
            `}
          >
            <span>#{tag.name}</span>
            <span className="opacity-50 text-[0.8em]">{tag.count}</span>
          </Link>
        );
      })}
    </div>
  );
}
