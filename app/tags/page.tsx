import { getAllTags } from "@/lib/content";
import Link from "next/link";

export const metadata = {
  title: "태그",
  description: "태그별 글 모아보기",
};

export default function TagsPage() {
  const tags = getAllTags();
  const maxCount = tags.length > 0 ? tags[0].count : 1;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight theme-heading">태그</h1>
        <p className="text-muted-foreground mt-3 text-sm">
          총 {tags.length}개의 태그
        </p>
      </div>

      {/* Tag cloud */}
      <div className="flex flex-wrap gap-2">
        {tags.map(({ name, count }) => {
          const ratio = count / maxCount;
          const sizeClass = ratio > 0.7 ? "text-base px-4 py-2" : ratio > 0.4 ? "text-sm px-3 py-1.5" : "text-xs px-2.5 py-1";
          return (
            <Link
              key={name}
              href={`/tags/${encodeURIComponent(name)}`}
              className={`theme-tag rounded-full hover:scale-105 transition-all duration-200 ${sizeClass}`}
            >
              #{name}
              <span className="ml-1.5 opacity-60">{count}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
