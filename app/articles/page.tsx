import { getAllArticles, getUrlSlug } from "@/lib/content";
import { ArticleList } from "@/components/article/article-list";

const ARTICLES_PER_PAGE = 10;

interface ArticlesPageProps {
  searchParams: Promise<{ page?: string; moc?: string }>;
}

export const metadata = {
  title: "아티클",
  description: "지식 노트와 에버그린 콘텐츠를 확인하세요.",
};

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  const mocFilter = params.moc;

  let allArticles = getAllArticles();

  // MOC 필터 적용
  if (mocFilter) {
    allArticles = allArticles.filter((a) => a.moc === mocFilter);
  }

  const totalPages = Math.ceil(allArticles.length / ARTICLES_PER_PAGE);

  const articles = allArticles.slice(
    (currentPage - 1) * ARTICLES_PER_PAGE,
    currentPage * ARTICLES_PER_PAGE
  );

  // MOC 목록 추출
  const mocs = Array.from(new Set(getAllArticles().map((a) => a.moc).filter(Boolean))) as string[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">아티클</h1>
        <p className="text-muted-foreground mt-2">
          총 {allArticles.length}개의 아티클
          {mocFilter && ` (${mocFilter})`}
        </p>
      </div>

      {/* MOC 필터 */}
      {mocs.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <a
            href="/articles"
            className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
              !mocFilter
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-accent"
            }`}
          >
            전체
          </a>
          {mocs.map((moc) => (
            <a
              key={moc}
              href={`/articles?moc=${encodeURIComponent(moc)}`}
              className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                mocFilter === moc
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-accent"
              }`}
            >
              {moc}
            </a>
          ))}
        </div>
      )}

      <ArticleList
        articles={articles.map((a) => ({ ...a, slug: getUrlSlug(a.slug) }))}
        currentPage={currentPage}
        totalPages={totalPages}
        basePath={mocFilter ? `/articles?moc=${encodeURIComponent(mocFilter)}` : "/articles"}
      />
    </div>
  );
}
