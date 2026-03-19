import { getAllPosts, getAllArticles, getAllLibraryItems, getAllCategories, getAllTags, getUrlSlug } from "@/lib/content";
import { FileText, BookOpen, Library, Tag, FolderOpen, ImageOff, Languages, FileWarning, AlertTriangle, Upload } from "lucide-react";
import Link from "next/link";
import ImageUpload from "@/components/admin/image-upload";

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-lg border border-border/60 p-4 space-y-1">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const allPosts = getAllPosts();
  const koPosts = allPosts.filter((p) => p.lang === "ko" || !p.lang);
  const enPosts = allPosts.filter((p) => p.lang === "en");
  const articles = getAllArticles();
  const libraryItems = getAllLibraryItems();
  const categories = getAllCategories();
  const tags = getAllTags();

  // Action items
  const postsWithoutImage = koPosts.filter((p) => !p.image);
  const postsWithoutTranslation = koPosts.filter((koPost) => {
    const slug = koPost.slug.replace(/^posts\//, "");
    return !enPosts.some((enPost) => enPost.slug.replace(/^posts\//, "").replace(/-en$/, "") === slug);
  });

  // SEO issues
  const postsWithLongTitle = koPosts.filter((p) => p.title.length > 60);
  const postsWithoutDescription = koPosts.filter((p) => !p.description || p.description.trim() === "");
  const postsWithoutTags = koPosts.filter((p) => !p.tags || p.tags.length === 0);
  const totalSeoIssues = postsWithLongTitle.length + postsWithoutDescription.length + postsWithoutImage.length + postsWithoutTags.length;

  return (
    <div className="space-y-8">
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={FileText} label="포스트" value={koPosts.length} sub={`영어 ${enPosts.length}개`} />
        <StatCard icon={BookOpen} label="아티클" value={articles.length} />
        <StatCard icon={Library} label="서재" value={libraryItems.length} />
        <StatCard icon={FolderOpen} label="카테고리" value={categories.length} sub={`태그 ${tags.length}개`} />
      </div>

      {/* Action items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SEO Issues */}
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-semibold">SEO 이슈</h3>
            </div>
            <span className="text-xs text-muted-foreground bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
              {totalSeoIssues}
            </span>
          </div>
          <div className="space-y-3">
            {/* Long titles */}
            {postsWithLongTitle.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-medium text-amber-600 dark:text-amber-400">제목 60자 초과</h4>
                  <span className="text-xs text-amber-600/70 dark:text-amber-400/70">{postsWithLongTitle.length}개</span>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {postsWithLongTitle.slice(0, 5).map((post) => (
                    <Link key={post.slug} href={`/posts/${getUrlSlug(post.slug)}`} className="block text-xs text-muted-foreground truncate py-0.5 hover:text-primary transition-colors">
                      {post.title} <span className="text-amber-500">({post.title.length}자)</span>
                    </Link>
                  ))}
                  {postsWithLongTitle.length > 5 && (
                    <p className="text-xs text-muted-foreground/50">+{postsWithLongTitle.length - 5}개 더</p>
                  )}
                </div>
              </div>
            )}

            {/* Missing descriptions */}
            {postsWithoutDescription.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-medium text-amber-600 dark:text-amber-400">설명 누락</h4>
                  <span className="text-xs text-amber-600/70 dark:text-amber-400/70">{postsWithoutDescription.length}개</span>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {postsWithoutDescription.slice(0, 5).map((post) => (
                    <Link key={post.slug} href={`/posts/${getUrlSlug(post.slug)}`} className="block text-xs text-muted-foreground truncate py-0.5 hover:text-primary transition-colors">
                      {post.title}
                    </Link>
                  ))}
                  {postsWithoutDescription.length > 5 && (
                    <p className="text-xs text-muted-foreground/50">+{postsWithoutDescription.length - 5}개 더</p>
                  )}
                </div>
              </div>
            )}

            {/* Missing images */}
            {postsWithoutImage.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-medium text-amber-600 dark:text-amber-400">이미지 누락</h4>
                  <span className="text-xs text-amber-600/70 dark:text-amber-400/70">{postsWithoutImage.length}개</span>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {postsWithoutImage.slice(0, 5).map((post) => (
                    <Link key={post.slug} href={`/posts/${getUrlSlug(post.slug)}`} className="block text-xs text-muted-foreground truncate py-0.5 hover:text-primary transition-colors">
                      {post.title}
                    </Link>
                  ))}
                  {postsWithoutImage.length > 5 && (
                    <p className="text-xs text-muted-foreground/50">+{postsWithoutImage.length - 5}개 더</p>
                  )}
                </div>
              </div>
            )}

            {/* Missing tags */}
            {postsWithoutTags.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-medium text-amber-600 dark:text-amber-400">태그 없음</h4>
                  <span className="text-xs text-amber-600/70 dark:text-amber-400/70">{postsWithoutTags.length}개</span>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {postsWithoutTags.slice(0, 5).map((post) => (
                    <Link key={post.slug} href={`/posts/${getUrlSlug(post.slug)}`} className="block text-xs text-muted-foreground truncate py-0.5 hover:text-primary transition-colors">
                      {post.title}
                    </Link>
                  ))}
                  {postsWithoutTags.length > 5 && (
                    <p className="text-xs text-muted-foreground/50">+{postsWithoutTags.length - 5}개 더</p>
                  )}
                </div>
              </div>
            )}

            {totalSeoIssues === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">모든 포스트가 SEO 기준을 충족합니다 ✓</p>
            )}
          </div>
        </div>

        {/* Posts without translation */}
        <div className="rounded-lg border border-border/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-blue-500" />
              <h3 className="text-sm font-semibold">번역 안 된 포스트</h3>
            </div>
            <span className="text-xs text-muted-foreground bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
              {postsWithoutTranslation.length}
            </span>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {postsWithoutTranslation.slice(0, 10).map((post) => (
              <Link key={post.slug} href={`/posts/${getUrlSlug(post.slug)}`} className="block text-xs text-muted-foreground truncate py-1 border-b border-border/30 last:border-0 hover:text-primary transition-colors">
                {post.title}
              </Link>
            ))}
            {postsWithoutTranslation.length > 10 && (
              <p className="text-xs text-muted-foreground/50 pt-1">
                +{postsWithoutTranslation.length - 10}개 더
              </p>
            )}
          </div>
          {postsWithoutTranslation.length > 0 && (
            <Link href="/admin/translate" className="block mt-3 text-xs text-primary hover:underline">
              번역하러 가기 →
            </Link>
          )}
        </div>
      </div>

      {/* Category distribution */}
      <div className="rounded-lg border border-border/60 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">카테고리 분포</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(({ name, count }) => (
            <div key={name} className="flex items-center gap-1.5 text-xs bg-muted px-2.5 py-1 rounded-full">
              <span>{name}</span>
              <span className="text-muted-foreground">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Image Upload */}
      <div className="rounded-lg border border-border/60 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Upload className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">이미지 업로드</h3>
        </div>
        <ImageUpload />
      </div>
    </div>
  );
}
