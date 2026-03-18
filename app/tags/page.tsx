import { getAllTags } from "@/lib/content";
import { TagBubbles } from "@/components/tags/tag-bubbles";

export const metadata = {
  title: "태그",
  description: "태그별 글 모아보기",
};

export default function TagsPage() {
  const tags = getAllTags();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight theme-heading">태그</h1>
        <p className="text-muted-foreground mt-3 text-sm">
          {tags.length}개의 태그로 {tags.reduce((a, t) => a + t.count, 0)}개의 글을 분류
        </p>
      </div>

      <TagBubbles tags={tags} />
    </div>
  );
}
