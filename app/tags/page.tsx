import { getAllTags } from "@/lib/content";
import { TagBubbles } from "@/components/tags/tag-bubbles";
import { LangToggle } from "@/components/common/lang-toggle";

export const metadata = {
  title: "태그",
  description: "태그별 글 모아보기",
};

interface TagsPageProps {
  searchParams: Promise<{ lang?: string }>;
}

export default async function TagsPage({ searchParams }: TagsPageProps) {
  const params = await searchParams;
  const lang = (params.lang as "ko" | "en") || "ko";
  const tags = getAllTags(lang);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight theme-heading">태그</h1>
          <p className="text-muted-foreground mt-3 text-sm">
            {tags.length}개의 태그
          </p>
        </div>
        <LangToggle currentLang={lang} basePath="/tags" />
      </div>

      <TagBubbles tags={tags} />
    </div>
  );
}
