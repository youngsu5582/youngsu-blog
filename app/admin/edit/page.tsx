"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, Search, FileText, BookOpen, StickyNote, Library, ArrowRight } from "lucide-react";
import { TagInput } from "@/components/admin/tag-input";

interface ContentItem {
  slug: string;
  title: string;
  collection: string;
  date: string;
}

const COLLECTIONS = [
  { id: "posts", label: "포스트", icon: FileText },
  { id: "articles", label: "아티클", icon: BookOpen },
  { id: "notes", label: "노트", icon: StickyNote },
  { id: "library", label: "서재", icon: Library },
];

const COLLECTION_BADGE: Record<string, string> = {
  posts: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  articles: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  notes: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  library: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

export default function EditPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCollection, setFilterCollection] = useState<string | null>(null);

  // Selected item
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [body, setBody] = useState("");
  const [frontmatter, setFrontmatter] = useState<Record<string, any>>({});
  const [editSlug, setEditSlug] = useState("");
  const [loadingContent, setLoadingContent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Taxonomy autocomplete
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  // Move target
  const [moveTarget, setMoveTarget] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/content").then((r) => r.json()),
      fetch("/api/admin/content?file=_taxonomies").then((r) => r.json()),
    ]).then(([contentData, taxData]) => {
      setItems(contentData.items || []);
      setAllCategories(taxData.categories || []);
      setAllTags(taxData.tags || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = items.filter((item) => {
    const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) || item.slug.toLowerCase().includes(search.toLowerCase());
    const matchCollection = !filterCollection || item.collection === filterCollection;
    return matchSearch && matchCollection;
  });

  const loadContent = async (item: ContentItem) => {
    setSelectedItem(item);
    setEditSlug(item.slug);
    setLoadingContent(true);
    setResult(null);
    setMoveTarget(null);
    try {
      const filePath = `content/${item.collection}/${item.slug}.mdx`;
      const res = await fetch(`/api/admin/edit?file=${encodeURIComponent(filePath)}`);
      const data = await res.json();
      if (data.frontmatter) setFrontmatter(data.frontmatter);
      if (data.body !== undefined) setBody(data.body);
    } catch {}
    setLoadingContent(false);
  };

  const handleSave = async () => {
    if (!selectedItem) return;
    setSaving(true);
    setResult(null);
    try {
      const filePath = `content/${selectedItem.collection}/${selectedItem.slug}.mdx`;
      const newSlug = editSlug !== selectedItem.slug ? editSlug : undefined;
      const res = await fetch("/api/admin/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: filePath, frontmatter, body, newSlug }),
      });
      const data = await res.json();
      if (data.success) {
        const msg = data.renamed ? `저장 완료 (파일명: ${editSlug}.mdx)` : "저장 완료";
        setResult({ success: true, message: msg });
        if (data.renamed) {
          const updated = { ...selectedItem, slug: editSlug };
          setSelectedItem(updated);
          setItems((prev) => prev.map((i) =>
            i.slug === selectedItem.slug && i.collection === selectedItem.collection ? updated : i
          ));
        }
      } else {
        setResult({ success: false, message: data.error });
      }
    } catch {
      setResult({ success: false, message: "저장 실패" });
    }
    setSaving(false);
  };

  const handleMove = async () => {
    if (!selectedItem || !moveTarget || moveTarget === selectedItem.collection) return;
    setSaving(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/edit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromFile: `content/${selectedItem.collection}/${selectedItem.slug}.mdx`,
          toCollection: moveTarget,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ success: true, message: `${moveTarget}로 이동 완료` });
        // Update items list
        setItems((prev) => prev.map((i) =>
          i.slug === selectedItem.slug && i.collection === selectedItem.collection
            ? { ...i, collection: moveTarget }
            : i
        ));
        setSelectedItem({ ...selectedItem, collection: moveTarget });
        setMoveTarget(null);
      } else {
        setResult({ success: false, message: data.error });
      }
    } catch {
      setResult({ success: false, message: "이동 실패" });
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">콘텐츠 편집</h2>
        <p className="text-sm text-muted-foreground mt-1">포스트, 아티클, 노트, 서재를 검색하고 편집합니다</p>
      </div>

      {result && (
        <div className={`rounded-lg p-3 text-sm ${result.success ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"}`}>
          {result.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
        {/* Left: Content list */}
        <div className="rounded-lg border border-border/60 p-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="검색..."
              className="w-full pl-8 rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>

          {/* Collection filter */}
          <div className="flex flex-wrap gap-1">
            <button onClick={() => setFilterCollection(null)}
              className={`text-[10px] px-2 py-1 rounded-full transition-colors ${!filterCollection ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              전체 ({items.length})
            </button>
            {COLLECTIONS.map((col) => {
              const count = items.filter((i) => i.collection === col.id).length;
              return (
                <button key={col.id} onClick={() => setFilterCollection(filterCollection === col.id ? null : col.id)}
                  className={`text-[10px] px-2 py-1 rounded-full transition-colors ${filterCollection === col.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {col.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Items */}
          <div className="space-y-0.5 max-h-[65vh] overflow-y-auto">
            {filtered.map((item) => (
              <button key={`${item.collection}-${item.slug}`} onClick={() => loadContent(item)}
                className={`w-full text-left p-2 rounded-md transition-colors text-xs ${
                  selectedItem?.slug === item.slug && selectedItem?.collection === item.collection
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-muted/50 border border-transparent"
                }`}>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] px-1 py-0.5 rounded font-medium ${COLLECTION_BADGE[item.collection] || ""}`}>
                    {item.collection === "posts" ? "P" : item.collection === "articles" ? "A" : item.collection === "notes" ? "N" : "L"}
                  </span>
                  <span className="truncate font-medium">{item.title}</span>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">검색 결과가 없습니다</p>
            )}
          </div>
        </div>

        {/* Right: Editor */}
        {selectedItem ? (
          loadingContent ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-4">
              {/* Frontmatter */}
              <div className="rounded-lg border border-border/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">메타데이터</h3>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${COLLECTION_BADGE[selectedItem.collection]}`}>
                    {selectedItem.collection}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">제목</label>
                    <input value={frontmatter.title || ""} onChange={(e) => setFrontmatter({ ...frontmatter, title: e.target.value })}
                      className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">설명</label>
                    <input value={frontmatter.description || ""} onChange={(e) => setFrontmatter({ ...frontmatter, description: e.target.value })}
                      className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Slug (파일명)</label>
                  <input value={editSlug} onChange={(e) => setEditSlug(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  <p className="text-[10px] text-muted-foreground/50">파일: content/{selectedItem.collection}/{editSlug || "..."}.mdx</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <TagInput label="카테고리" values={frontmatter.categories || []} suggestions={allCategories}
                    onChange={(cats) => setFrontmatter({ ...frontmatter, categories: cats })} />
                  <TagInput label="태그" values={frontmatter.tags || []} suggestions={allTags}
                    onChange={(tags) => setFrontmatter({ ...frontmatter, tags: tags })} />
                </div>

                {/* Library: mediaType */}
                {selectedItem.collection === "library" && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">미디어 타입</label>
                    <div className="flex gap-2">
                      {(["book", "movie", "life"] as const).map((type) => (
                        <button key={type} onClick={() => setFrontmatter({ ...frontmatter, mediaType: type })}
                          className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                            frontmatter.mediaType === type ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                          }`}>
                          {type === "book" ? "📚 책" : type === "movie" ? "🎬 영화" : "🏃 라이프"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Move collection */}
                <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                  <span className="text-xs text-muted-foreground">컬렉션 이동:</span>
                  {COLLECTIONS.filter((c) => c.id !== selectedItem.collection).map((col) => (
                    <button key={col.id} onClick={() => setMoveTarget(moveTarget === col.id ? null : col.id)}
                      className={`text-[10px] px-2 py-1 rounded-full transition-colors ${moveTarget === col.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                      {col.label}
                    </button>
                  ))}
                  {moveTarget && (
                    <button onClick={handleMove} disabled={saving}
                      className="text-[10px] px-2 py-1 rounded-full bg-amber-500 text-white flex items-center gap-1">
                      <ArrowRight className="h-3 w-3" /> 이동
                    </button>
                  )}
                </div>
              </div>

              {/* Body editor */}
              <div className="rounded-lg border border-border/60 overflow-hidden" style={{ minHeight: "50vh" }}>
                <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-muted/30">
                  <span className="text-xs font-medium text-muted-foreground">마크다운</span>
                  <span className="text-[10px] text-muted-foreground/50">{body.length}자</span>
                </div>
                <textarea value={body} onChange={(e) => setBody(e.target.value)} spellCheck={false}
                  className="w-full bg-background px-4 py-3 text-sm font-mono resize-none focus:outline-none leading-relaxed"
                  style={{ minHeight: "45vh" }} />
              </div>

              {/* Save */}
              <button onClick={handleSave} disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors w-full justify-center">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                저장하기
              </button>
            </div>
          )
        ) : (
          <div className="rounded-lg border border-border/60 flex items-center justify-center py-20">
            <div className="text-center">
              <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">콘텐츠를 선택하면 편집할 수 있습니다</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
