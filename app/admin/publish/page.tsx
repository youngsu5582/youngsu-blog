"use client";

import { useState, useEffect } from "react";
import { Loader2, Check, Rocket, FileText, BookOpen, Library } from "lucide-react";
import { TagInput } from "@/components/admin/tag-input";

interface FileEntry { path: string; status: "M" | "A" | "D" | "?" }
interface Frontmatter {
  title?: string;
  description?: string;
  categories?: string[];
  tags?: string[];
  [key: string]: unknown;
}

const SECTIONS = [
  { id: "post", label: "포스트", icon: FileText },
  { id: "article", label: "아티클", icon: BookOpen },
  { id: "library-book", label: "책", icon: Library },
  { id: "library-movie", label: "영화", icon: Library },
  { id: "library-life", label: "라이프", icon: Library },
];

const STATUS_STYLE: Record<string, string> = {
  M: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  A: "bg-green-500/10 text-green-600 dark:text-green-400",
  D: "bg-red-500/10 text-red-600 dark:text-red-400",
  "?": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
};

export default function PublishPage() {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [section, setSection] = useState("post");
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Metadata editing
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [frontmatter, setFrontmatter] = useState<Frontmatter>({});
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);

  // All existing categories/tags for autocomplete
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  // Fetch git status + existing taxonomies
  useEffect(() => {
    fetch("/api/admin/git/status")
      .then((r) => r.json())
      .then((data) => {
        const entries: FileEntry[] = [
          ...data.modified.map((p: string) => ({ path: p, status: "M" as const })),
          ...data.added.map((p: string) => ({ path: p, status: "A" as const })),
          ...data.deleted.map((p: string) => ({ path: p, status: "D" as const })),
          ...data.untracked.map((p: string) => ({ path: p, status: "?" as const })),
        ];
        setFiles(entries);
        const contentFiles = new Set(
          entries.filter((f) => f.path.startsWith("content/")).map((f) => f.path)
        );
        setSelected(contentFiles);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Fetch all existing categories and tags
    fetch("/api/admin/content?file=_taxonomies")
      .then((r) => r.json())
      .then((data) => {
        if (data.categories) setAllCategories(data.categories);
        if (data.tags) setAllTags(data.tags);
      })
      .catch(() => {});
  }, []);

  // Load frontmatter when clicking a content file
  const loadFrontmatter = async (filePath: string) => {
    if (!filePath.endsWith(".mdx")) return;
    setEditingFile(filePath);
    setLoadingMeta(true);
    try {
      const res = await fetch(`/api/admin/content?file=${encodeURIComponent(filePath)}`);
      const data = await res.json();
      if (data.frontmatter) setFrontmatter(data.frontmatter);
    } catch {}
    setLoadingMeta(false);
  };

  // Save frontmatter
  const saveFrontmatter = async () => {
    if (!editingFile) return;
    setSavingMeta(true);
    try {
      await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: editingFile, frontmatter }),
      });
      setResult({ success: true, message: `${editingFile} 메타데이터 저장 완료` });
    } catch {
      setResult({ success: false, message: "메타데이터 저장 실패" });
    }
    setSavingMeta(false);
  };

  const toggleFile = (path: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path); else next.add(path);
      return next;
    });
  };

  const handlePublish = async () => {
    if (selected.size === 0) return;
    setPublishing(true);
    setResult(null);

    const sectionLabel = SECTIONS.find((s) => s.id === section)?.label || "포스트";
    const contentFiles = [...selected].filter((f) => f.startsWith("content/"));
    let msg: string;
    if (contentFiles.length === 1) {
      const name = contentFiles[0].replace(/^content\/(posts|articles|library)\//, "").replace(/\.mdx$/, "");
      msg = `docs: '${name}' ${sectionLabel} 발행`;
    } else if (contentFiles.length > 1) {
      msg = `docs: ${sectionLabel} ${contentFiles.length}개 발행`;
    } else {
      msg = `chore: ${selected.size}개 파일 업데이트`;
    }

    try {
      const res = await fetch("/api/admin/git/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, files: [...selected] }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ success: true, message: `발행 완료! (${data.hash})` });
        setEditingFile(null);
        // Refresh
        setTimeout(() => location.reload(), 1000);
      } else {
        setResult({ success: false, message: data.error });
      }
    } catch {
      setResult({ success: false, message: "발행 실패" });
    }
    setPublishing(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  if (files.length === 0) {
    return (
      <div className="space-y-6">
        <div><h2 className="text-xl font-semibold">발행</h2></div>
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-lg">
          <div className="p-3 rounded-full bg-green-500/10 mb-4"><Check className="h-6 w-6 text-green-500" /></div>
          <p className="text-sm font-medium">변경사항이 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-semibold">발행</h2></div>

      {result && (
        <div className={`rounded-lg p-3 text-sm ${result.success ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"}`}>
          {result.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-5">
        {/* Left: File selection */}
        <div className="space-y-4">
          {/* Files */}
          <div className="rounded-lg border border-border/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">파일 ({files.length})</h3>
              <span className="text-[11px] text-muted-foreground">{selected.size}개 선택</span>
            </div>
            <div className="space-y-0.5 max-h-64 overflow-y-auto">
              {files.map((file) => (
                <label
                  key={file.path}
                  className={`flex items-center gap-2 text-xs py-1.5 px-2 rounded cursor-pointer transition-colors ${selected.has(file.path) ? "bg-primary/5" : "hover:bg-muted/50"}`}
                >
                  <input type="checkbox" checked={selected.has(file.path)} onChange={() => toggleFile(file.path)} className="rounded border-border" />
                  <span className={`px-1 py-0.5 rounded font-mono text-[10px] ${STATUS_STYLE[file.status]}`}>{file.status}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); loadFrontmatter(file.path); }}
                    className={`font-mono truncate text-left hover:text-primary ${editingFile === file.path ? "text-primary font-medium" : "text-muted-foreground"}`}
                  >
                    {file.path.replace("content/", "")}
                  </button>
                </label>
              ))}
            </div>
          </div>

          {/* Section */}
          <div className="rounded-lg border border-border/60 p-4">
            <h3 className="text-sm font-semibold mb-3">섹션</h3>
            <div className="flex flex-wrap gap-1.5">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSection(s.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all ${section === s.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                  >
                    <Icon className="h-3 w-3" />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Publish button */}
          <button
            onClick={handlePublish}
            disabled={publishing || selected.size === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full justify-center"
          >
            {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            발행하기
          </button>
        </div>

        {/* Right: Metadata editor */}
        <div className="rounded-lg border border-border/60 p-4">
          {editingFile ? (
            loadingMeta ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">메타데이터</h3>
                  <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[200px]">{editingFile.replace("content/", "")}</span>
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">제목</label>
                  <input
                    value={frontmatter.title || ""}
                    onChange={(e) => setFrontmatter({ ...frontmatter, title: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">설명</label>
                  <textarea
                    value={frontmatter.description || ""}
                    onChange={(e) => setFrontmatter({ ...frontmatter, description: e.target.value })}
                    rows={2}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* Categories */}
                <TagInput
                  label="카테고리"
                  values={frontmatter.categories || []}
                  suggestions={allCategories}
                  onChange={(cats) => setFrontmatter({ ...frontmatter, categories: cats })}
                />

                {/* Tags */}
                <TagInput
                  label="태그"
                  values={frontmatter.tags || []}
                  suggestions={allTags}
                  onChange={(tags) => setFrontmatter({ ...frontmatter, tags: tags })}
                />

                <button
                  onClick={saveFrontmatter}
                  disabled={savingMeta}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
                >
                  {savingMeta ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  메타데이터 저장
                </button>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">파일명을 클릭하면</p>
              <p className="text-sm text-muted-foreground">메타데이터를 편집할 수 있습니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
