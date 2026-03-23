"use client";

import { useState, useEffect, useMemo } from "react";
import { Loader2, Languages, Check, Sparkles, Save, AlertTriangle, Search, Filter } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { TagInput } from "@/components/admin/tag-input";

interface PostInfo {
  filePath: string;
  filename: string;
  title: string;
  categories: string[];
  tags: string[];
}

interface AiProvider {
  id: string;
  label: string;
  available: boolean;
  type: "cli" | "api";
}

interface Translation {
  title: string;
  description: string;
  categories: string[];
  tags: string[];
  content: string;
}

export default function TranslatePage() {
  const [posts, setPosts] = useState<PostInfo[]>([]);
  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [translating, setTranslating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [translation, setTranslation] = useState<Translation | null>(null);
  const [originalContent, setOriginalContent] = useState("");
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [postSearch, setPostSearch] = useState("");
  const [hideTranslated, setHideTranslated] = useState(false);
  const [translatedSlugs, setTranslatedSlugs] = useState<Set<string>>(new Set());
  const [showPostPicker, setShowPostPicker] = useState(false);

  useEffect(() => {
    // Fetch Korean posts (exclude -en.mdx files)
    fetch("/api/admin/content?file=_posts")
      .then((r) => r.json())
      .then((data) => {
        const allPosts = (data.posts || []) as PostInfo[];
        const enSlugs = new Set(
          allPosts
            .filter((p) => p.filename.endsWith("-en"))
            .map((p) => p.filename.replace(/-en$/, ""))
        );
        setTranslatedSlugs(enSlugs);
        const koreanPosts = allPosts.filter(
          (p) => !p.filename.endsWith("-en")
        );
        setPosts(koreanPosts);
        setAllCategories(data.categories || []);
        setAllTags(data.tags || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Fetch AI providers
    fetch("/api/admin/ai/providers")
      .then((r) => r.json())
      .then((data) => {
        setProviders(data.providers || []);

        // Load saved provider from localStorage
        const saved = localStorage.getItem("admin-translate-provider");
        if (saved) {
          setSelectedProvider(saved);
        } else {
          const firstAvailable = (data.providers || []).find(
            (p: AiProvider) => p.available
          );
          if (firstAvailable) {
            setSelectedProvider(firstAvailable.id);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleTranslate = async () => {
    if (!selectedPost || !selectedProvider) {
      setResult({ success: false, message: "포스트와 프로바이더를 선택하세요" });
      return;
    }

    setTranslating(true);
    setResult(null);
    setTranslation(null);

    try {
      // Call translate API (it reads the file internally)
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath: selectedPost,
          provider: selectedProvider,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setTranslation(data.translation);
        setOriginalContent(data.originalContent || "");
        setResult({
          success: true,
          message: `번역 완료 (${data.provider}) — 검토 후 저장하세요`,
        });
        localStorage.setItem("admin-translate-provider", selectedProvider);
      } else {
        setResult({ success: false, message: data.error });
      }
    } catch (err: any) {
      setResult({ success: false, message: err.message || "번역 실패" });
    }

    setTranslating(false);
  };

  const handleSave = async () => {
    if (!translation || !selectedPost) return;

    setSaving(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/translate/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalPath: selectedPost,
          title: translation.title,
          description: translation.description,
          categories: translation.categories,
          tags: translation.tags,
          content: translation.content,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setResult({
          success: true,
          message: `저장 완료: ${data.filePath}${data.existed ? " (덮어쓰기)" : " (새 파일)"}`,
        });
        setTranslation(null);
        setOriginalContent("");
        setSelectedPost("");
      } else {
        setResult({ success: false, message: data.error });
      }
    } catch (err: any) {
      setResult({ success: false, message: err.message || "저장 실패" });
    }

    setSaving(false);
  };

  const updateTranslation = (updates: Partial<Translation>) => {
    if (!translation) return;
    setTranslation({ ...translation, ...updates });
  };

  const filteredPosts = useMemo(() => {
    let filtered = posts;
    if (hideTranslated) {
      filtered = filtered.filter((p) => !translatedSlugs.has(p.filename));
    }
    if (postSearch.trim()) {
      const q = postSearch.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.filename.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [posts, hideTranslated, translatedSlugs, postSearch]);

  const selectedPostInfo = posts.find((p) => p.filePath === selectedPost);
  const availableProviders = providers.filter((p) => p.available);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (availableProviders.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">번역기</h2>
          <p className="text-sm text-muted-foreground mt-1">
            AI 모델로 포스트를 번역하고 비교합니다
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-lg">
          <div className="p-3 rounded-full bg-primary/10 mb-4">
            <Languages className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-medium mb-1">AI 프로바이더가 설정되지 않았습니다</p>
          <p className="text-xs text-muted-foreground max-w-sm text-center">
            .env.local에 API 키를 추가하거나 CLI 도구를 설치하세요
          </p>
          <div className="flex gap-2 mt-4">
            {providers.map((p) => (
              <span
                key={p.id}
                className="text-[11px] px-2.5 py-1 rounded-full bg-muted text-muted-foreground"
              >
                {p.label} — {p.available ? "사용 가능" : "미설정"}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">번역기</h2>
        <p className="text-sm text-muted-foreground mt-1">
          한국어 포스트를 영어로 번역하고 검토합니다
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

      {/* Controls */}
      <div className="rounded-lg border border-border/60 p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              포스트 선택 (한국어)
            </label>
            <div className="relative">
              <button
                onClick={() => !translating && setShowPostPicker(!showPostPicker)}
                disabled={translating}
                className="w-full text-left rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              >
                {selectedPostInfo ? (
                  <span className="flex items-center gap-2">
                    {selectedPostInfo.title}
                    {translatedSlugs.has(selectedPostInfo.filename) && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400">번역됨</span>
                    )}
                  </span>
                ) : (
                  <span className="text-muted-foreground">포스트를 선택하세요</span>
                )}
              </button>

              {showPostPicker && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowPostPicker(false)} />
                  <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-md border border-border bg-popover shadow-lg max-h-80 flex flex-col">
                    <div className="p-2 border-b border-border/40 space-y-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                          value={postSearch}
                          onChange={(e) => setPostSearch(e.target.value)}
                          placeholder="제목 또는 slug 검색..."
                          className="w-full pl-8 rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          autoFocus
                        />
                      </div>
                      <button
                        onClick={() => setHideTranslated(!hideTranslated)}
                        className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors ${
                          hideTranslated
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Filter className="h-3 w-3" />
                        번역 완료 숨기기
                      </button>
                    </div>
                    <div className="overflow-y-auto flex-1">
                      {filteredPosts.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          {postSearch ? "검색 결과가 없습니다" : "포스트가 없습니다"}
                        </div>
                      ) : (
                        filteredPosts.map((post) => {
                          const isTranslated = translatedSlugs.has(post.filename);
                          return (
                            <button
                              key={post.filePath}
                              onClick={() => {
                                setSelectedPost(post.filePath);
                                setShowPostPicker(false);
                                setPostSearch("");
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center justify-between ${
                                selectedPost === post.filePath ? "bg-accent" : ""
                              }`}
                            >
                              <span className="truncate mr-2">{post.title}</span>
                              {isTranslated && (
                                <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400">
                                  번역됨
                                </span>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                    <div className="p-2 border-t border-border/40 text-[10px] text-muted-foreground">
                      {filteredPosts.length}개 포스트
                      {hideTranslated && ` (번역 완료 ${posts.length - filteredPosts.length}개 숨김)`}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              AI 프로바이더
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              disabled={translating}
            >
              <option value="">프로바이더를 선택하세요</option>
              {availableProviders.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} ({p.type === "cli" ? "CLI" : "API"})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleTranslate}
            disabled={translating || !selectedPost || !selectedProvider}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-gradient-to-r from-violet-500/10 to-blue-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 hover:from-violet-500/20 hover:to-blue-500/20 transition-all disabled:opacity-50 text-sm font-medium"
          >
            {translating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {translating ? "번역 중..." : "번역하기"}
          </button>

          {translation && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "저장 중..." : "저장하기"}
            </button>
          )}
        </div>
      </div>

      {/* Translation Result */}
      {translation && (
        <>
          {/* Metadata Edit */}
          <div className="rounded-lg border border-border/60 p-4 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              번역된 메타데이터 (수정 가능)
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                제목
              </label>
              <input
                value={translation.title}
                onChange={(e) => updateTranslation({ title: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                설명
              </label>
              <textarea
                value={translation.description}
                onChange={(e) =>
                  updateTranslation({ description: e.target.value })
                }
                rows={2}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <TagInput
              label="카테고리"
              values={translation.categories}
              suggestions={allCategories}
              onChange={(cats) => updateTranslation({ categories: cats })}
            />

            <TagInput
              label="태그"
              values={translation.tags}
              suggestions={allTags}
              onChange={(tags) => updateTranslation({ tags: tags })}
            />
          </div>

          {/* Side-by-side comparison */}
          <div className="rounded-lg border border-border/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">콘텐츠 비교</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertTriangle className="h-3 w-3" />
                <span>코드, 링크, 포맷 확인 필수</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Original Korean */}
              <div className="rounded-md border border-border bg-muted/30 p-4 space-y-2 max-h-[600px] overflow-y-auto">
                <div className="flex items-center gap-2 mb-2 sticky top-0 bg-muted/30 pb-2 border-b border-border/40">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-xs font-medium text-muted-foreground">
                    원본 (한국어)
                  </span>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {originalContent}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Translated English */}
              <div className="rounded-md border border-border bg-muted/30 p-4 space-y-2 max-h-[600px] overflow-y-auto">
                <div className="flex items-center gap-2 mb-2 sticky top-0 bg-muted/30 pb-2 border-b border-border/40">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-xs font-medium text-muted-foreground">
                    번역 (영어)
                  </span>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {translation.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>

            {/* Editable content */}
            <div className="space-y-1.5 pt-3 border-t border-border/40">
              <label className="text-xs font-medium text-muted-foreground">
                번역 내용 직접 수정
              </label>
              <textarea
                value={translation.content}
                onChange={(e) => updateTranslation({ content: e.target.value })}
                rows={10}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
