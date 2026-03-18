import { getAllLibraryItems, getUrlSlug } from "@/lib/content";
import { LibraryGrid } from "@/components/library/library-grid";
import { LayoutGrid, List } from "lucide-react";

const ITEMS_PER_PAGE = 12;

interface LibraryPageProps {
  searchParams: Promise<{ page?: string; type?: string; view?: string }>;
}

export const metadata = {
  title: "라이브러리",
  description: "읽은 책과 영화 리뷰를 확인하세요.",
};

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  const typeFilter = params.type as "book" | "movie" | "life" | undefined;
  const viewMode = (params.view as "grid" | "list") || "grid";

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
        <h1 className="text-3xl font-bold tracking-tight theme-heading">라이브러리</h1>
        <p className="text-muted-foreground mt-3 text-sm">
          총 {allItems.length}개의 항목
          {typeFilter && ` (${typeFilter === "book" ? "책" : typeFilter === "movie" ? "영화" : "라이프"})`}
        </p>
      </div>

      {/* Type 필터 + 뷰 토글 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <a
            href={`/library${viewMode === "list" ? "?view=list" : ""}`}
            className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
              !typeFilter
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-accent"
            }`}
          >
            전체
          </a>
          <a
            href={`/library?type=book${viewMode === "list" ? "&view=list" : ""}`}
            className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
              typeFilter === "book"
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-accent"
            }`}
          >
            📚 책
          </a>
          <a
            href={`/library?type=movie${viewMode === "list" ? "&view=list" : ""}`}
            className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
              typeFilter === "movie"
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-accent"
            }`}
          >
            🎬 영화
          </a>
          <a
            href={`/library?type=life${viewMode === "list" ? "&view=list" : ""}`}
            className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
              typeFilter === "life"
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-accent"
            }`}
          >
            🏃 라이프
          </a>
        </div>

        {/* 뷰 토글 */}
        <div className="flex gap-1 border border-border rounded-md p-0.5">
          <a
            href={`/library${typeFilter ? `?type=${typeFilter}` : ""}`}
            className={`p-1.5 rounded transition-colors ${
              viewMode === "grid"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="카드뷰"
          >
            <LayoutGrid className="h-4 w-4" />
          </a>
          <a
            href={`/library?${typeFilter ? `type=${typeFilter}&` : ""}view=list`}
            className={`p-1.5 rounded transition-colors ${
              viewMode === "list"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="목록뷰"
          >
            <List className="h-4 w-4" />
          </a>
        </div>
      </div>

      <LibraryGrid
        items={items.map((item) => ({ ...item, slug: getUrlSlug(item.slug) }))}
        currentPage={currentPage}
        totalPages={totalPages}
        basePath={typeFilter ? `/library?type=${typeFilter}` : "/library"}
        viewMode={viewMode}
      />
    </div>
  );
}
