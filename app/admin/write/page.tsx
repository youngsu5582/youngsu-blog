"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, FileText } from "lucide-react";
import { TagInput } from "@/components/admin/tag-input";

interface Frontmatter {
  title: string;
  description: string;
  categories: string[];
  tags: string[];
  image?: string;
}

export default function WritePage() {
  const [collection, setCollection] = useState<"posts" | "articles" | "notes" | "library">("posts");
  const [frontmatter, setFrontmatter] = useState<Frontmatter>({
    title: "",
    description: "",
    categories: [],
    tags: [],
  });
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/admin/posts")
      .then((r) => r.json())
      .then((data) => {
        setAllCategories(data.categories || []);
        setAllTags(data.tags || []);
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!frontmatter.title.trim()) {
      setResult({ success: false, message: "제목을 입력하세요" });
      return;
    }
    if (!body.trim()) {
      setResult({ success: false, message: "본문을 입력하세요" });
      return;
    }

    setSaving(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collection,
          frontmatter,
          body,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResult({ success: true, message: `저장 완료! (${data.filePath})` });
        // Reset form
        setFrontmatter({ title: "", description: "", categories: [], tags: [] });
        setBody("");
      } else {
        setResult({ success: false, message: data.error });
      }
    } catch {
      setResult({ success: false, message: "저장 실패" });
    }

    setSaving(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">간편 작성기</h2>
        <p className="text-sm text-muted-foreground mt-1">
          마크다운으로 새 글을 작성하고 저장하세요
        </p>
      </div>

      {result && (
        <div
          className={`rounded-lg p-3 text-sm ${
            result.success
              ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
              : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
          }`}
        >
          {result.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-5">
        {/* Left: Metadata */}
        <div className="space-y-4">
          {/* Collection selector */}
          <div className="rounded-lg border border-border/60 p-4 space-y-3">
            <h3 className="text-sm font-semibold">컬렉션 선택</h3>
            <div className="grid grid-cols-2 gap-2">
              {(["posts", "articles", "notes", "library"] as const).map((col) => (
                <button
                  key={col}
                  onClick={() => setCollection(col)}
                  className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    collection === col
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {col === "posts" ? "포스트" :
                   col === "articles" ? "아티클" :
                   col === "notes" ? "노트" : "서재"}
                </button>
              ))}
            </div>
          </div>

          {/* Metadata fields */}
          <div className="rounded-lg border border-border/60 p-4 space-y-4">
            <h3 className="text-sm font-semibold">메타데이터</h3>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">제목 *</label>
              <input
                value={frontmatter.title}
                onChange={(e) => setFrontmatter({ ...frontmatter, title: e.target.value })}
                placeholder="포스트 제목"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">설명</label>
              <textarea
                value={frontmatter.description}
                onChange={(e) => setFrontmatter({ ...frontmatter, description: e.target.value })}
                placeholder="간단한 설명 (SEO용)"
                rows={3}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <TagInput
              label="카테고리"
              values={frontmatter.categories}
              suggestions={allCategories}
              onChange={(cats) => setFrontmatter({ ...frontmatter, categories: cats })}
            />

            <TagInput
              label="태그"
              values={frontmatter.tags}
              suggestions={allTags}
              onChange={(tags) => setFrontmatter({ ...frontmatter, tags: tags })}
            />

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">썸네일 URL</label>
              <input
                value={frontmatter.image || ""}
                onChange={(e) => setFrontmatter({ ...frontmatter, image: e.target.value || undefined })}
                placeholder="https://... 또는 /assets/img/..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full justify-center"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            저장하기
          </button>
        </div>

        {/* Right: Markdown editor */}
        <div className="rounded-lg border border-border/60 p-4 space-y-3 h-fit">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">마크다운 에디터</h3>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="마크다운으로 작성하세요...

## 소제목

본문 내용을 자유롭게 작성하세요.

- 리스트 아이템
- 또 다른 아이템

```javascript
// 코드 블록도 가능
const hello = 'world';
```
"
            rows={25}
            className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <p className="text-[10px] text-muted-foreground">
            {body.length} 글자
          </p>
        </div>
      </div>
    </div>
  );
}
