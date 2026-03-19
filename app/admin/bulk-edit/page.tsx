"use client";

import { useState, useEffect } from "react";
import { Loader2, Check, Settings, Search, Plus, Minus, Tag, FolderOpen } from "lucide-react";
import { TagInput } from "@/components/admin/tag-input";

interface PostFile {
  filePath: string;
  filename: string;
  title: string;
  categories: string[];
  tags: string[];
}

type ActionType = "addTag" | "removeTag" | "setCategory";

export default function BulkEditPage() {
  const [posts, setPosts] = useState<PostFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [action, setAction] = useState<ActionType>("addTag");
  const [tagValue, setTagValue] = useState<string[]>([]);
  const [categoryValue, setCategoryValue] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    // Fetch all mdx files from content/posts
    fetch("/api/admin/content?file=_posts")
      .then((r) => r.json())
      .then((data) => {
        setPosts(data.posts || []);
        setAllCategories(data.categories || []);
        setAllTags(data.tags || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleFile = (filePath: string) => {
    const newSet = new Set(selectedFiles);
    if (newSet.has(filePath)) {
      newSet.delete(filePath);
    } else {
      newSet.add(filePath);
    }
    setSelectedFiles(newSet);
  };

  const toggleAll = () => {
    if (selectedFiles.size === filtered.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filtered.map((p) => p.filePath)));
    }
  };

  const handleApply = async () => {
    if (selectedFiles.size === 0) {
      setResult({ success: false, message: "선택된 포스트가 없습니다" });
      return;
    }

    let value: string | string[];
    if (action === "setCategory") {
      if (categoryValue.length === 0) {
        setResult({ success: false, message: "카테고리를 선택하세요" });
        return;
      }
      value = categoryValue;
    } else {
      if (tagValue.length === 0) {
        setResult({ success: false, message: "태그를 입력하세요" });
        return;
      }
      value = tagValue;
    }

    setProcessing(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/bulk-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: Array.from(selectedFiles),
          action,
          value,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResult({ success: true, message: `${data.updated}개 파일 업데이트 완료` });
        setSelectedFiles(new Set());
        setTagValue([]);
        setCategoryValue([]);
        // Refresh list
        const refreshData = await fetch("/api/admin/content?file=_posts").then((r) => r.json());
        setPosts(refreshData.posts || []);
      } else {
        setResult({ success: false, message: data.error });
      }
    } catch {
      setResult({ success: false, message: "업데이트 실패" });
    }
    setProcessing(false);
  };

  const filtered = posts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.filename.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">일괄 수정</h2>
        <p className="text-xs text-muted-foreground mt-1">여러 포스트의 메타데이터를 한번에 변경</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-5">
        {/* Left: File selection */}
        <div className="rounded-lg border border-border/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">포스트 선택</h3>
            <span className="text-xs text-muted-foreground">
              {selectedFiles.size}개 선택됨
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="검색..."
              className="w-full pl-8 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleAll}
              className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors"
            >
              {selectedFiles.size === filtered.length ? "전체 해제" : "전체 선택"}
            </button>
          </div>

          <div className="space-y-1 max-h-[500px] overflow-y-auto">
            {filtered.map((post) => (
              <label
                key={post.filePath}
                className="flex items-start gap-3 p-2.5 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedFiles.has(post.filePath)}
                  onChange={() => toggleFile(post.filePath)}
                  className="mt-0.5 rounded border-border"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{post.title}</div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                    <span className="truncate">{post.filename}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {post.categories.map((cat) => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      >
                        <FolderOpen className="h-2.5 w-2.5" />
                        {cat}
                      </span>
                    ))}
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary"
                      >
                        <Tag className="h-2.5 w-2.5" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Right: Action panel */}
        <div className="space-y-4">
          <div className="rounded-lg border border-border/60 p-4 space-y-4">
            <h3 className="text-sm font-semibold">작업 선택</h3>

            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={action === "addTag"}
                  onChange={() => setAction("addTag")}
                  className="border-border"
                />
                <div className="flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  <span className="text-sm">태그 추가</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={action === "removeTag"}
                  onChange={() => setAction("removeTag")}
                  className="border-border"
                />
                <div className="flex items-center gap-2">
                  <Minus className="h-3.5 w-3.5" />
                  <span className="text-sm">태그 제거</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={action === "setCategory"}
                  onChange={() => setAction("setCategory")}
                  className="border-border"
                />
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-3.5 w-3.5" />
                  <span className="text-sm">카테고리 설정</span>
                </div>
              </label>
            </div>

            <div className="pt-2 border-t border-border/60">
              {action === "setCategory" ? (
                <TagInput
                  label="카테고리"
                  values={categoryValue}
                  suggestions={allCategories}
                  onChange={setCategoryValue}
                />
              ) : (
                <TagInput
                  label="태그"
                  values={tagValue}
                  suggestions={allTags}
                  onChange={setTagValue}
                />
              )}
            </div>
          </div>

          <button
            onClick={handleApply}
            disabled={processing || selectedFiles.size === 0}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full justify-center"
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            적용
          </button>
        </div>
      </div>
    </div>
  );
}
