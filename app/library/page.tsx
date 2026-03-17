import { getAllLibraryItems, getUrlSlug } from "@/lib/content";
import { LibraryGrid } from "@/components/library/library-grid";

const ITEMS_PER_PAGE = 12;

interface LibraryPageProps {
  searchParams: Promise<{ page?: string; type?: string }>;
}

export const metadata = {
  title: "라이브러리",
  description: "읽은 책과 영화 리뷰를 확인하세요.",
};

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  const typeFilter = params.type as "book" | "movie" | undefined;

  let allItems = getAllLibraryItems();

  // Type 필터 적용
  if (typeFilter) {
    allItems = allItems.filter((item) => item.mediaType === typeFilter);
  }

  const totalPages = Math.ceil(allItems.length / ITEMS_PER_PAGE);

  const items = allItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">라이브러리</h1>
        <p className="text-muted-foreground mt-2">
          총 {allItems.length}개의 항목
          {typeFilter && ` (${typeFilter === "book" ? "책" : "영화"})`}
        </p>
      </div>

      {/* Type 필터 */}
      <div className="flex gap-2">
        <a
          href="/library"
          className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
            !typeFilter
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-accent"
          }`}
        >
          전체
        </a>
        <a
          href="/library?type=book"
          className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
            typeFilter === "book"
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-accent"
          }`}
        >
          📚 책
        </a>
        <a
          href="/library?type=movie"
          className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
            typeFilter === "movie"
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-accent"
          }`}
        >
          🎬 영화
        </a>
      </div>

      <LibraryGrid
        items={items.map((item) => ({ ...item, slug: getUrlSlug(item.slug) }))}
        currentPage={currentPage}
        totalPages={totalPages}
        basePath={typeFilter ? `/library?type=${typeFilter}` : "/library"}
      />
    </div>
  );
}
