"use client";

import { useState, useEffect } from "react";
import { Loader2, Rocket, Search, Check, Image as ImageIcon, Languages, FileText, Sparkles } from "lucide-react";
import { TagInput } from "@/components/admin/tag-input";

interface PostInfo {
  filePath: string;
  filename: string;
  gitStatus: string;
  title: string;
  description: string;
  categories: string[];
  tags: string[];
  image?: string;
  hasEnVersion: boolean;
  enFilePath?: string;
}

interface Frontmatter {
  title: string;
  description: string;
  categories: string[];
  tags: string[];
  image?: string;
}

export default function PublishPage() {
  const [posts, setPosts] = useState<PostInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPost, setSelectedPost] = useState<PostInfo | null>(null);
  const [frontmatter, setFrontmatter] = useState<Frontmatter>({ title: "", description: "", categories: [], tags: [] });
  const [includeEn, setIncludeEn] = useState(false);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/posts")
      .then((r) => r.json())
      .then((data) => {
        setPosts(data.posts || []);
        setAllCategories(data.categories || []);
        setAllTags(data.tags || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const selectPost = (post: PostInfo) => {
    setSelectedPost(post);
    setFrontmatter({
      title: post.title,
      description: post.description,
      categories: post.categories,
      tags: post.tags,
      image: post.image,
    });
    setIncludeEn(post.hasEnVersion);
    setResult(null);
  };

  const handleAiSuggest = async () => {
    if (!selectedPost) return;
    setAiLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath: selectedPost.filePath,
          existingCategories: allCategories,
          existingTags: allTags,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const s = data.suggestion;
        setFrontmatter((prev) => ({
          ...prev,
          description: s.description || prev.description,
          categories: s.categories || prev.categories,
          tags: s.tags || prev.tags,
        }));
        setResult({ success: true, message: `AI(${data.model}) 제안 적용됨 — 확인 후 수정하세요` });
      } else {
        setResult({ success: false, message: data.error });
      }
    } catch {
      setResult({ success: false, message: "AI 요청 실패" });
    }
    setAiLoading(false);
  };

  const handlePublish = async () => {
    if (!selectedPost) return;
    setPublishing(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: selectedPost.filename,
          frontmatter,
          includeEn,
          enSlug: selectedPost.enFilePath?.replace("content/posts/", "").replace(".mdx", ""),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ success: true, message: `발행 완료! (${data.hash})` });
        // Remove from list
        setPosts((prev) => prev.filter((p) => p.filePath !== selectedPost.filePath));
        setSelectedPost(null);
      } else {
        setResult({ success: false, message: data.error });
      }
    } catch {
      setResult({ success: false, message: "발행 실패" });
    }
    setPublishing(false);
  };

  const filtered = posts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.filename.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  if (posts.length === 0) {
    return (
      <div className="space-y-6">
        <div><h2 className="text-xl font-semibold">발행</h2></div>
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-lg">
          <div className="p-3 rounded-full bg-green-500/10 mb-4"><Check className="h-6 w-6 text-green-500" /></div>
          <p className="text-sm font-medium">발행할 포스트가 없습니다</p>
          <p className="text-xs text-muted-foreground mt-1">content/posts/에 새 .mdx 파일을 추가하세요</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-5">
        {/* Left: Post list */}
        <div className="rounded-lg border border-border/60 p-4 space-y-3">
          <h3 className="text-sm font-semibold">포스트 선택</h3>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="검색..."
              className="w-full pl-8 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {filtered.map((post) => (
              <button
                key={post.filePath}
                onClick={() => selectPost(post)}
                className={`w-full text-left p-2.5 rounded-md transition-colors ${
                  selectedPost?.filePath === post.filePath
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-muted/50 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${post.gitStatus === "new" ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600"}`}>
                    {post.gitStatus === "new" ? "NEW" : "MOD"}
                  </span>
                  <span className="text-sm font-medium truncate">{post.title}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 ml-10">
                  {post.image && <ImageIcon className="h-3 w-3 text-green-500" />}
                  {post.hasEnVersion && <Languages className="h-3 w-3 text-blue-500" />}
                  {post.categories.length > 0 && (
                    <span className="text-[10px] text-muted-foreground">{post.categories[0]}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Metadata + Publish */}
        <div className="space-y-4">
          {selectedPost ? (
            <>
              {/* Metadata */}
              <div className="rounded-lg border border-border/60 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">메타데이터</h3>
                  <button
                    onClick={handleAiSuggest}
                    disabled={aiLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-gradient-to-r from-violet-500/10 to-blue-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 hover:from-violet-500/20 hover:to-blue-500/20 transition-all disabled:opacity-50"
                  >
                    {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    AI 도움받기
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">제목</label>
                  <input
                    value={frontmatter.title}
                    onChange={(e) => setFrontmatter({ ...frontmatter, title: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">설명</label>
                  <textarea
                    value={frontmatter.description}
                    onChange={(e) => setFrontmatter({ ...frontmatter, description: e.target.value })}
                    rows={2}
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
                  {frontmatter.image && (
                    <p className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1">
                      <Check className="h-3 w-3" /> 썸네일 설정됨
                    </p>
                  )}
                </div>
              </div>

              {/* Options */}
              <div className="rounded-lg border border-border/60 p-4 space-y-3">
                <h3 className="text-sm font-semibold">발행 옵션</h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeEn}
                    onChange={(e) => setIncludeEn(e.target.checked)}
                    disabled={!selectedPost.hasEnVersion}
                    className="rounded border-border"
                  />
                  <div>
                    <span className="text-sm">영어 번역 포함</span>
                    {selectedPost.hasEnVersion ? (
                      <span className="text-[10px] text-green-600 dark:text-green-400 ml-2">번역본 있음</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground ml-2">번역본 없음</span>
                    )}
                  </div>
                </label>
              </div>

              {/* Publish */}
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full justify-center"
              >
                {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                발행하기
              </button>
            </>
          ) : (
            <div className="rounded-lg border border-border/60 p-4 flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">포스트를 선택하면</p>
              <p className="text-sm text-muted-foreground">메타데이터 편집 + AI 도움을 받을 수 있습니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
