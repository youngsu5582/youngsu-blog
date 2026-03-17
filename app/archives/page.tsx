import { getAllPosts, getAllArticles, getUrlSlug } from "@/lib/content";
import Link from "next/link";

export const metadata = {
  title: "Archives",
  description: "연도별 글 타임라인",
};

interface TimelineItem {
  title: string;
  slug: string;
  date: string;
  type: "post" | "article";
}

export default function ArchivesPage() {
  const posts = getAllPosts();
  const articles = getAllArticles();

  // 모든 글을 합쳐서 날짜순 정렬
  const allItems: TimelineItem[] = [
    ...posts.map((p) => ({
      title: p.title,
      slug: getUrlSlug(p.slug),
      date: p.date,
      type: "post" as const,
    })),
    ...articles.map((a) => ({
      title: a.title,
      slug: getUrlSlug(a.slug),
      date: a.date,
      type: "article" as const,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // 연도별 그룹핑
  const grouped = new Map<number, TimelineItem[]>();
  allItems.forEach((item) => {
    const year = new Date(item.date).getFullYear();
    if (!grouped.has(year)) grouped.set(year, []);
    grouped.get(year)!.push(item);
  });

  const years = Array.from(grouped.keys()).sort((a, b) => b - a);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Archives</h1>
        <p className="text-muted-foreground mt-2">
          총 {allItems.length}개의 글
        </p>
      </div>

      <div className="space-y-10">
        {years.map((year) => {
          const items = grouped.get(year)!;
          return (
            <section key={year}>
              {/* 연도 헤더 */}
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-2xl font-bold">{year}</h2>
                <span className="text-sm text-muted-foreground">({items.length})</span>
                <div className="h-2 w-2 rounded-full bg-primary" />
              </div>

              {/* 타임라인 아이템 */}
              <div className="border-l-2 border-border ml-1 pl-6 space-y-0">
                {items.map((item) => {
                  const d = new Date(item.date);
                  const month = String(d.getMonth() + 1).padStart(2, "0");
                  const day = String(d.getDate()).padStart(2, "0");
                  const href =
                    item.type === "article"
                      ? `/articles/${item.slug}`
                      : `/posts/${item.slug}`;

                  return (
                    <div
                      key={`${item.type}-${item.slug}`}
                      className="group relative flex items-center gap-4 py-2.5 border-b border-border/50 last:border-b-0"
                    >
                      {/* 타임라인 도트 */}
                      <div className="absolute -left-[31px] h-2.5 w-2.5 rounded-full border-2 border-border bg-background group-hover:border-primary transition-colors" />

                      {/* 날짜 */}
                      <span className="text-sm text-muted-foreground font-mono w-14 flex-shrink-0">
                        {day} / {month}
                      </span>

                      {/* 타입 뱃지 */}
                      <span
                        className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
                          item.type === "article"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {item.type === "article" ? "📄 Article" : "📝 Post"}
                      </span>

                      {/* 제목 */}
                      <Link
                        href={href}
                        className="text-sm font-medium hover:text-primary transition-colors truncate"
                      >
                        {item.title}
                      </Link>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
