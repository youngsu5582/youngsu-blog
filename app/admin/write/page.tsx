"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, FileText, BookOpen, StickyNote, Library, Eye, EyeOff } from "lucide-react";
import { TagInput } from "@/components/admin/tag-input";

const COLLECTIONS = [
  { id: "posts", label: "포스트", icon: FileText },
  { id: "articles", label: "아티클", icon: BookOpen },
  { id: "notes", label: "노트", icon: StickyNote },
  { id: "library", label: "서재", icon: Library },
];

export default function WritePage() {
  const [content, setContent] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [showMeta, setShowMeta] = useState(false);

  const [collection, setCollection] = useState("posts");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [thumbnail, setThumbnail] = useState("");

  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/content?file=_taxonomies")
      .then((r) => r.json())
      .then((data) => {
        if (data.categories) setAllCategories(data.categories);
        if (data.tags) setAllTags(data.tags);
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!title.trim()) { setResult({ success: false, message: "제목을 입력하세요" }); return; }
    setSaving(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection, title, description, categories, tags, thumbnail, content }),
      });
      const data = await res.json();
      setResult(data.success ? { success: true, message: `저장 완료: ${data.filePath}` } : { success: false, message: data.error });
    } catch { setResult({ success: false, message: "저장 실패" }); }
    setSaving(false);
  };

  const previewHtml = content
    .replace(/^### (.+)$/gm, "<h3 class='text-lg font-semibold mt-4 mb-2'>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2 class='text-xl font-semibold mt-6 mb-3'>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1 class='text-2xl font-bold mt-8 mb-4'>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code class='bg-muted px-1.5 py-0.5 rounded text-sm'>$1</code>")
    .replace(/^- (.+)$/gm, "<li class='ml-4'>• $1</li>")
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">간편 작성기</h2>
          <p className="text-sm text-muted-foreground mt-1">마크다운으로 작성하고 저장</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowMeta(!showMeta)}
            className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${showMeta ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
          >
            메타데이터 {showMeta ? "접기" : "펼치기"}
          </button>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground border border-border transition-colors"
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {result && (
        <div className={`rounded-lg p-3 text-sm ${result.success ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"}`}>
          {result.message}
        </div>
      )}

      {/* Metadata (collapsible) */}
      {showMeta && (
        <div className="rounded-lg border border-border/60 p-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {COLLECTIONS.map((col) => {
              const Icon = col.icon;
              return (
                <button key={col.id} onClick={() => setCollection(col.id)}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all ${collection === col.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                >
                  <Icon className="h-3.5 w-3.5" />{col.label}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">제목 *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="포스트 제목"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">설명</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="간단한 설명 (SEO용)"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TagInput label="카테고리" values={categories} suggestions={allCategories} onChange={setCategories} />
            <TagInput label="태그" values={tags} suggestions={allTags} onChange={setTags} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">썸네일 URL</label>
            <input value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} placeholder="https://... 또는 /assets/img/..."
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>
      )}

      {/* Editor + Preview */}
      <div className={`grid gap-4 ${showPreview ? "grid-cols-1 lg:grid-cols-[1.2fr_1fr]" : "grid-cols-1"}`} style={{ minHeight: "60vh" }}>
        <div className="flex flex-col rounded-lg border border-border/60 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground">마크다운</span>
            <span className="text-[10px] text-muted-foreground/50">{content.length}자</span>
          </div>
          <textarea
            value={content} onChange={(e) => setContent(e.target.value)} spellCheck={false}
            placeholder={"마크다운으로 작성하세요...\n\n## 소제목\n\n본문 내용을 자유롭게 작성하세요.\n\n- 리스트 아이템\n\n```java\npublic class Hello {}\n```"}
            className="flex-1 w-full bg-background px-4 py-3 text-sm font-mono resize-none focus:outline-none leading-relaxed"
          />
        </div>

        {showPreview && (
          <div className="flex flex-col rounded-lg border border-border/60 overflow-hidden">
            <div className="px-3 py-2 border-b border-border/40 bg-muted/30">
              <span className="text-xs font-medium text-muted-foreground">미리보기</span>
            </div>
            <div
              className="flex-1 px-4 py-3 prose prose-sm prose-neutral dark:prose-invert max-w-none overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: previewHtml || '<p class="text-muted-foreground text-sm">내용을 입력하면 미리보기가 표시됩니다.</p>' }}
            />
          </div>
        )}
      </div>

      {/* Bottom: title (if meta hidden) + save */}
      <div className="flex items-center gap-3">
        {!showMeta && (
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목을 입력하세요 *"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        )}
        <button onClick={handleSave} disabled={saving || !title.trim()}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          저장하기
        </button>
      </div>
    </div>
  );
}
