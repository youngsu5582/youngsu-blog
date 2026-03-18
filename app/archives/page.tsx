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

  const grouped = new Map<number, TimelineItem[]>();
  allItems.forEach((item) => {
    const year = new Date(item.date).getFullYear();
    if (!grouped.has(year)) grouped.set(year, []);
    grouped.get(year)!.push(item);
  });

  const years = Array.from(grouped.keys()).sort((a, b) => b - a);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight sora-heading">Archives</h1>
        <p className="text-muted-foreground mt-3 text-sm">
          총 {allItems.length}개의 글
        </p>
      </div>

      <div className="space-y-12">
        {years.map((year) => {
          const items = grouped.get(year)!;
          return (
            <section key={year}>
              {/* Year header */}
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-2xl font-bold sora-gradient-text">{year}</h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
                <div className="flex-1 sora-divider" />
              </div>

              {/* Timeline items */}
              <div className="border-l border-border/60 ml-2 pl-6 space-y-0">
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
                      className="group relative flex items-center gap-4 py-3 border-b border-border/30 last:border-b-0"
                    >
                      {/* Timeline dot */}
                      <div className="absolute -left-[29px] h-2 w-2 rounded-full sora-timeline-dot" />

                      {/* Date */}
                      <span className="text-xs text-muted-foreground/70 font-mono w-14 flex-shrink-0 tabular-nums">
                        {month}.{day}
                      </span>

                      {/* Type badge */}
                      <span
                        className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                          item.type === "article"
                            ? "bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15"
                            : "sora-tag"
                        }`}
                      >
                        {item.type === "article" ? "Article" : "Post"}
                      </span>

                      {/* Title */}
                      <Link
                        href={href}
                        className="text-sm hover:text-primary transition-colors duration-200 truncate"
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
