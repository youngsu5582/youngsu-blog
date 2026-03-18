import { getAllCategories } from "@/lib/content";
import Link from "next/link";

export const metadata = {
  title: "카테고리",
  description: "카테고리별 글 모아보기",
};

export default function CategoriesPage() {
  const categories = getAllCategories();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight theme-heading">카테고리</h1>
        <p className="text-muted-foreground mt-3 text-sm">
          총 {categories.length}개의 카테고리
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {categories.map(({ name, count }) => (
          <Link
            key={name}
            href={`/categories/${encodeURIComponent(name)}`}
            className="group flex items-center justify-between rounded-lg border border-border/60 px-4 py-3 hover:border-primary/30 hover:bg-primary/5 dark:hover:bg-primary/8 transition-all duration-200"
          >
            <span className="text-sm font-medium group-hover:text-primary transition-colors truncate">
              {name}
            </span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
              {count}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
