"use client";

import { useState, useEffect } from "react";
import { Loader2, Rocket, Search, Check, Image as ImageIcon, Languages, FileText, Sparkles, GitPullRequest, GitCommit, AlertTriangle, Eye } from "lucide-react";
import { TagInput } from "@/components/admin/tag-input";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function TranslationPreview({ filePath }: { filePath: string }) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/edit?file=${encodeURIComponent(filePath)}`)
      .then((r) => r.json())
      .then((data) => {
        setContent(data.body || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filePath]);

  if (loading) return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />;
  if (!content) return <p className="text-[10px] text-muted-foreground">미리보기를 불러올 수 없습니다</p>;

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none text-xs">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content.slice(0, 1500)}</ReactMarkdown>
      {content.length > 1500 && <p className="text-[10px] text-muted-foreground mt-2">... (일부만 표시)</p>}
    </div>
  );
}

function PostContentPreview({ filePath }: { filePath: string }) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/edit?file=${encodeURIComponent(filePath)}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "본문을 불러올 수 없습니다");
        if (!cancelled) setContent(data.body || "");
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "본문을 불러올 수 없습니다");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filePath]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        본문을 불러오는 중...
      </div>
    );
  }

  if (error) {
    return <p className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">{error}</p>;
  }

  if (!content) {
    return <p className="rounded-md border border-border/60 p-3 text-sm text-muted-foreground">본문이 비어 있습니다.</p>;
  }

  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-p:leading-relaxed prose-pre:max-w-full prose-pre:overflow-x-auto">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

interface PostInfo {
  filePath: string;
  filename: string;
  gitStatus: string;
  collection: string;
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

interface SelectedPost {
  post: PostInfo;
  frontmatter: Frontmatter;
  includeEn: boolean;
}

type PublishMode = "direct" | "pr";

interface AiProvider {
  id: string;
  label: string;
  available: boolean;
  type: "cli" | "api";
}

interface PendingAiSuggestion {
  filePath: string;
  model: string;
  suggestion: Partial<Pick<Frontmatter, "description" | "categories" | "tags">>;
}

// Helper function to detect non-ASCII characters in filename
function hasNonAsciiFilename(filePath: string): boolean {
  const filename = filePath.split("/").pop() || "";
  // Check if filename contains any non-ASCII characters
  return /[^\x00-\x7F]/.test(filename);
}

function getQualityWarnings(post: PostInfo, frontmatter: Frontmatter): string[] {
  const warnings: string[] = [];
  if (!frontmatter.image) warnings.push("썸네일 URL이 비어 있음");
  if (!frontmatter.description || frontmatter.description.trim().length === 0) warnings.push("설명(description)이 비어 있음");
  if (frontmatter.tags.length === 0) warnings.push("태그가 비어 있음");
  if (frontmatter.categories.length === 0) warnings.push("카테고리가 비어 있음");
  if (hasNonAsciiFilename(post.filePath)) warnings.push("slug에 비영문 문자가 있음");
  return warnings;
}

function getPublishActionLabel(mode: PublishMode, autoPush: boolean) {
  if (mode === "pr") return "PR 생성 후 리뷰/머지";
  if (autoPush) return "main에 직접 커밋 후 origin/main으로 푸시";
  return "main에 직접 커밋 (푸시 없음)";
}

function getReviewSummary(review: string) {
  const scoreMatch = review.match(/(?:리뷰\s*)?(?:점수|평가)\s*[:：]?\s*(\d(?:\.\d)?\s*\/\s*5|\d(?:\.\d)?\s*점)/i) || review.match(/(\d(?:\.\d)?\s*\/\s*5)/);
  const decisionMatch = review.match(/최종\s*판단\s*[:：]\s*([^\n]+)/);

  return {
    score: scoreMatch ? scoreMatch[1].replace(/\s+/g, "") : null,
    decision: decisionMatch ? decisionMatch[1].trim() : null,
    hasChecklist: /발행 전 체크리스트|체크리스트/.test(review),
    hasSensitiveCheck: /민감정보|회사정보|홈서버/.test(review),
    hasVoiceCheck: /내 말투|AI스럽|말투/.test(review),
  };
}

export default function PublishPage() {
  const [posts, setPosts] = useState<PostInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showNeedsQualityOnly, setShowNeedsQualityOnly] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState<Map<string, SelectedPost>>(new Map());
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [thumbnailLoading, setThumbnailLoading] = useState(false);
  const [translateLoading, setTranslateLoading] = useState(false);
  const [mode, setMode] = useState<PublishMode>("direct");
  const [autoPush, setAutoPush] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [aiProviders, setAiProviders] = useState<AiProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [generatedFiles, setGeneratedFiles] = useState<Map<string, string[]>>(new Map());
  const [thumbnailPreview, setThumbnailPreview] = useState<Map<string, string>>(new Map());
  const [thumbnailModels, setThumbnailModels] = useState<{ id: string; displayName: string }[]>([]);
  const [selectedThumbnailModel, setSelectedThumbnailModel] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewContent, setReviewContent] = useState<Map<string, string>>(new Map());
  const [showReview, setShowReview] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [previewPost, setPreviewPost] = useState<PostInfo | null>(null);
  const [pendingAiSuggestion, setPendingAiSuggestion] = useState<PendingAiSuggestion | null>(null);

  // Helper functions for localStorage persistence
  const updateGeneratedFiles = (updater: (prev: Map<string, string[]>) => Map<string, string[]>) => {
    setGeneratedFiles((prev) => {
      const next = updater(prev);
      localStorage.setItem("admin-generated-files", JSON.stringify(Array.from(next.entries())));
      return next;
    });
  };

  const updateThumbnailPreview = (updater: (prev: Map<string, string>) => Map<string, string>) => {
    setThumbnailPreview((prev) => {
      const next = updater(prev);
      localStorage.setItem("admin-thumbnail-previews", JSON.stringify(Array.from(next.entries())));
      return next;
    });
  };

  const clearPersistedData = () => {
    setGeneratedFiles(new Map());
    setThumbnailPreview(new Map());
    localStorage.removeItem("admin-generated-files");
    localStorage.removeItem("admin-thumbnail-previews");
  };

  useEffect(() => {
    // Load persisted data from localStorage
    try {
      const savedGeneratedFiles = localStorage.getItem("admin-generated-files");
      if (savedGeneratedFiles) {
        const entries = JSON.parse(savedGeneratedFiles);
        setGeneratedFiles(new Map(entries));
      }

      const savedThumbnailPreviews = localStorage.getItem("admin-thumbnail-previews");
      if (savedThumbnailPreviews) {
        const entries = JSON.parse(savedThumbnailPreviews);
        setThumbnailPreview(new Map(entries));
      }
    } catch (e) {
      console.error("Failed to load persisted data:", e);
    }

    // Fetch posts
    fetch("/api/admin/posts")
      .then((r) => r.json())
      .then((data) => {
        setPosts(data.posts || []);
        setAllCategories(data.categories || []);
        setAllTags(data.tags || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Fetch available AI providers
    fetch("/api/admin/ai/providers")
      .then((r) => r.json())
      .then((data) => {
        setAiProviders(data.providers || []);

        // Load saved provider preference from localStorage
        const savedProvider = localStorage.getItem("ai-provider-preference");
        if (savedProvider) {
          setSelectedProvider(savedProvider);
        } else {
          // Default to first available provider
          const firstAvailable = (data.providers || []).find((p: AiProvider) => p.available);
          if (firstAvailable) {
            setSelectedProvider(firstAvailable.id);
          }
        }
      })
      .catch(() => {});

    // Fetch thumbnail models
    fetch("/api/admin/thumbnail/models")
      .then((r) => r.json())
      .then((data) => {
        const models = data.models || [];
        setThumbnailModels(models);
        const saved = localStorage.getItem("admin-thumbnail-model");
        if (saved && models.some((m: any) => m.id === saved)) {
          setSelectedThumbnailModel(saved);
        } else if (models.length > 0) {
          setSelectedThumbnailModel(models[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const toggleSelect = (post: PostInfo) => {
    setSelectedPosts((prev) => {
      const next = new Map(prev);
      if (next.has(post.filePath)) {
        next.delete(post.filePath);
        if (editingPost === post.filePath) setEditingPost(null);
      } else {
        next.set(post.filePath, {
          post,
          frontmatter: {
            title: post.title,
            description: post.description,
            categories: post.categories,
            tags: post.tags,
            image: post.image,
          },
          includeEn: post.hasEnVersion,
        });
        setEditingPost(post.filePath);
      }
      return next;
    });
    setResult(null);
  };

  const updateFrontmatter = (filePath: string, fm: Frontmatter) => {
    setSelectedPosts((prev) => {
      const next = new Map(prev);
      const entry = next.get(filePath);
      if (entry) next.set(filePath, { ...entry, frontmatter: fm });
      return next;
    });
  };

  const updateIncludeEn = (filePath: string, includeEn: boolean) => {
    setSelectedPosts((prev) => {
      const next = new Map(prev);
      const entry = next.get(filePath);
      if (entry) next.set(filePath, { ...entry, includeEn });
      return next;
    });
  };

  const editing = editingPost ? selectedPosts.get(editingPost) : null;

  const handleAiSuggest = async () => {
    if (!editing || !editingPost) return;

    // Check if a provider is selected
    if (!selectedProvider) {
      setResult({ success: false, message: "AI 프로바이더를 선택하세요" });
      return;
    }

    setAiLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath: editing.post.filePath,
          existingCategories: allCategories,
          existingTags: allTags,
          provider: selectedProvider,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPendingAiSuggestion({
          filePath: editingPost,
          model: data.model,
          suggestion: data.suggestion,
        });
        setResult({ success: true, message: `AI(${data.model}) 제안 준비됨 — diff를 확인한 뒤 적용하세요` });

        // Save provider preference
        localStorage.setItem("ai-provider-preference", selectedProvider);
      } else {
        setResult({ success: false, message: data.error });
      }
    } catch {
      setResult({ success: false, message: "AI 요청 실패" });
    }
    setAiLoading(false);
  };

  const applyPendingAiSuggestion = () => {
    if (!pendingAiSuggestion) return;
    const target = selectedPosts.get(pendingAiSuggestion.filePath);
    if (!target) return;
    const suggestion = pendingAiSuggestion.suggestion;
    updateFrontmatter(pendingAiSuggestion.filePath, {
      ...target.frontmatter,
      description: suggestion.description || target.frontmatter.description,
      categories: suggestion.categories || target.frontmatter.categories,
      tags: suggestion.tags || target.frontmatter.tags,
    });
    setPendingAiSuggestion(null);
    setResult({ success: true, message: `AI(${pendingAiSuggestion.model}) 제안 적용됨 — 확인 후 수정하세요` });
  };

  const formatAiDiff = (label: string, before: string | string[], after?: string | string[]) => {
    const beforeValue = Array.isArray(before) ? before.join(", ") : before.trim();
    const afterValue = Array.isArray(after) ? after.join(", ") : (after || "").trim();
    return `${label}: ${beforeValue || "(비어 있음)"} → ${afterValue || "(변경 없음)"}`;
  };

  const handleGenerateThumbnail = async () => {
    if (!editing || !editingPost) return;

    setThumbnailLoading(true);
    setResult(null);
    try {
      // Generate thumbnail
      const genRes = await fetch("/api/admin/thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath: editing.post.filePath,
          model: selectedThumbnailModel || "gemini-2.5-flash-image",
        }),
      });
      const genData = await genRes.json();

      if (!genData.success) {
        setResult({ success: false, message: genData.error || "썸네일 생성 실패" });
        setThumbnailLoading(false);
        return;
      }

      // Save thumbnail
      const saveRes = await fetch("/api/admin/thumbnail/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64: genData.base64,
          filename: editing.post.filename,
          originalPath: editing.post.filePath,
        }),
      });
      const saveData = await saveRes.json();

      if (saveData.success) {
        // Update frontmatter with thumbnail URL
        updateFrontmatter(editingPost, {
          ...editing.frontmatter,
          image: saveData.imagePath,
        });

        // Store preview
        updateThumbnailPreview((prev) => new Map(prev).set(editingPost, `data:image/png;base64,${genData.base64}`));

        // Track generated file
        updateGeneratedFiles((prev) => {
          const next = new Map(prev);
          const existing = next.get(editingPost) || [];
          next.set(editingPost, [...existing, saveData.savedPath]);
          return next;
        });

        setResult({ success: true, message: "썸네일 생성 완료!" });
      } else {
        setResult({ success: false, message: saveData.error || "썸네일 저장 실패" });
      }
    } catch {
      setResult({ success: false, message: "썸네일 생성 중 오류 발생" });
    }
    setThumbnailLoading(false);
  };

  const handleTranslate = async () => {
    if (!editing || !editingPost) return;

    if (!selectedProvider) {
      setResult({ success: false, message: "AI 프로바이더를 선택하세요" });
      return;
    }

    const overwriteTranslation = editing.post.hasEnVersion;
    if (overwriteTranslation && !window.confirm("이미 영어 번역본이 있습니다. 재번역하면 기존 번역본을 덮어씁니다. 계속할까요?")) {
      setResult({ success: false, message: "재번역을 취소했습니다" });
      return;
    }

    setTranslateLoading(true);
    setResult(null);
    try {
      // Translate
      const transRes = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath: editing.post.filePath,
          provider: selectedProvider,
        }),
      });
      const transData = await transRes.json();

      if (!transData.success) {
        setResult({ success: false, message: transData.error || "번역 실패" });
        setTranslateLoading(false);
        return;
      }

      // Save translation
      const t = transData.translation;
      const saveRes = await fetch("/api/admin/translate/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalPath: editing.post.filePath,
          title: t.title,
          description: t.description,
          categories: t.categories,
          tags: t.tags,
          content: t.content,
          overwrite: overwriteTranslation,
        }),
      });
      const saveData = await saveRes.json();

      if (saveData.success) {
        // Update state to reflect translation exists
        setSelectedPosts((prev) => {
          const next = new Map(prev);
          const entry = next.get(editingPost);
          if (entry) {
            entry.post.hasEnVersion = true;
            entry.post.enFilePath = saveData.enPath;
            entry.includeEn = true;
            next.set(editingPost, { ...entry });
          }
          return next;
        });

        // Track generated file
        updateGeneratedFiles((prev) => {
          const next = new Map(prev);
          const existing = next.get(editingPost) || [];
          next.set(editingPost, [...existing, saveData.enPath]);
          return next;
        });

        setResult({ success: true, message: "번역 완료!" });
      } else {
        setResult({ success: false, message: saveData.error || "번역 저장 실패" });
      }
    } catch {
      setResult({ success: false, message: "번역 중 오류 발생" });
    }
    setTranslateLoading(false);
  };

  const handleReview = async () => {
    if (!editing || !editingPost) return;
    if (!selectedProvider) {
      setResult({ success: false, message: "AI 프로바이더를 선택하세요" });
      return;
    }

    setReviewLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/ai/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath: editing.post.filePath,
          provider: selectedProvider,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReviewContent((prev) => new Map(prev).set(editingPost, data.review));
        setShowReview(true);
        setResult({ success: true, message: `리뷰 완료 (${data.provider})` });
        // 리뷰 영역으로 스크롤
        setTimeout(() => {
          const reviewElement = document.getElementById("review-result");
          if (typeof reviewElement?.scrollIntoView === "function") {
            reviewElement.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 100);
      } else {
        setResult({ success: false, message: data.error || "리뷰 실패" });
      }
    } catch {
      setResult({ success: false, message: "리뷰 중 오류 발생" });
    }
    setReviewLoading(false);
  };

  const handlePublish = async () => {
    if (selectedPosts.size === 0) return;
    setPublishing(true);
    setResult(null);
    try {
      const postsPayload = Array.from(selectedPosts.values()).map((s) => ({
        slug: s.post.filename,
        collection: s.post.collection,
        frontmatter: s.frontmatter,
        includeEn: s.includeEn,
        enSlug: s.post.enFilePath?.replace(`content/${s.post.collection}/`, "").replace(".mdx", ""),
        generatedFiles: generatedFiles.get(s.post.filePath) || [],
        gitStatus: s.post.gitStatus,
      }));

      const res = await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posts: postsPayload, mode, autoPush }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.mode === "pr") {
          setResult({ success: true, message: `PR 생성 완료! ${data.prUrl}` });
        } else {
          const pushMsg = data.pushed ? " + 푸시 완료" : data.pushError ? " (푸시 실패)" : "";
          setResult({ success: true, message: `발행 완료! (${data.hash})${pushMsg}` });
        }
        const publishedPaths = new Set(selectedPosts.keys());
        setPosts((prev) => prev.filter((p) => !publishedPaths.has(p.filePath)));
        setSelectedPosts(new Map());
        setEditingPost(null);
        clearPersistedData();
      } else {
        setResult({ success: false, message: data.error });
      }
    } catch {
      setResult({ success: false, message: "발행 실패" });
    }
    setPublishing(false);
  };

  const needsQualityWork = (post: PostInfo) => getQualityWarnings(post, {
    title: post.title,
    description: post.description,
    categories: post.categories,
    tags: post.tags,
    image: post.image,
  }).length > 0;

  const needsQualityCount = posts.filter(needsQualityWork).length;

  const filtered = posts.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.filename.toLowerCase().includes(search.toLowerCase());
    const matchQuality = !showNeedsQualityOnly || needsQualityWork(p);
    return matchSearch && matchQuality;
  });

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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">발행</h2>
        {selectedPosts.size > 0 && (
          <span className="text-xs text-muted-foreground">{selectedPosts.size}개 선택됨</span>
        )}
      </div>

      {result && (
        <div className={`rounded-lg p-3 text-sm ${result.success ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"}`}>
          {result.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-5">
        {/* Left: Post list */}
        <div className="rounded-lg border border-border/60 p-4 space-y-3">
          <h3 className="text-sm font-semibold">포스트 선택 (복수 가능)</h3>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="검색..."
              className="w-full pl-8 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setShowNeedsQualityOnly(false)}
              className={`text-[10px] px-2 py-1 rounded-full transition-colors ${!showNeedsQualityOnly ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              전체 ({posts.length})
            </button>
            <button
              type="button"
              onClick={() => setShowNeedsQualityOnly(!showNeedsQualityOnly)}
              className={`text-[10px] px-2 py-1 rounded-full transition-colors ${showNeedsQualityOnly ? "bg-amber-600 text-white" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}
            >
              품질 보완 필요 ({needsQualityCount})
            </button>
          </div>
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {filtered.map((post) => {
              const isSelected = selectedPosts.has(post.filePath);
              const isEditing = editingPost === post.filePath;
              const qualityWarningCount = getQualityWarnings(post, {
                title: post.title,
                description: post.description,
                categories: post.categories,
                tags: post.tags,
                image: post.image,
              }).length;
              return (
                <div
                  key={post.filePath}
                  className={`flex items-start gap-2 p-2.5 rounded-md transition-colors cursor-pointer ${
                    isEditing
                      ? "bg-primary/10 border border-primary/30"
                      : isSelected
                        ? "bg-primary/5 border border-primary/20"
                        : "hover:bg-muted/50 border border-transparent"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(post)}
                    className="mt-1 rounded border-border"
                  />
                  <button
                    className="flex-1 text-left"
                    onClick={() => {
                      if (!isSelected) toggleSelect(post);
                      else setEditingPost(post.filePath);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${post.gitStatus === "new" ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600"}`}>
                        {post.gitStatus === "new" ? "NEW" : "MOD"}
                      </span>
                      <span className="text-sm font-medium truncate">{post.title}</span>
                      {qualityWarningCount > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                          경고 {qualityWarningCount}개
                        </span>
                      )}
                      {hasNonAsciiFilename(post.filePath) && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-500" title="slug에 한글이 포함되어 있습니다">
                          <AlertTriangle className="h-3 w-3" />
                          <span className="font-medium">한글 slug</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 ml-10">
                      {post.image && <ImageIcon className="h-3 w-3 text-green-500" />}
                      {post.hasEnVersion && <Languages className="h-3 w-3 text-blue-500" />}
                      {post.categories.length > 0 && (
                        <span className="text-[10px] text-muted-foreground">{post.categories[0]}</span>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Metadata + Publish */}
        <div className="space-y-4">
          {editing ? (
            <>
              {/* Metadata */}
              <div className="rounded-lg border border-border/60 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold truncate">{editing.post.title}</h3>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setPreviewPost(editing.post)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-border text-foreground hover:bg-muted/50 transition-colors"
                    >
                      <Eye className="h-3 w-3" />
                      본문 미리보기
                    </button>
                    <select
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value)}
                      className="text-xs rounded-md border border-border bg-background px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      disabled={aiLoading}
                    >
                      <option value="">AI 선택</option>
                      {aiProviders.filter((p) => p.available).map((provider) => (
                        <option key={provider.id} value={provider.id}>
                          {provider.label} ({provider.type === "cli" ? "CLI" : "API"})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAiSuggest}
                      disabled={aiLoading || !selectedProvider}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-gradient-to-r from-violet-500/10 to-blue-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 hover:from-violet-500/20 hover:to-blue-500/20 transition-all disabled:opacity-50"
                    >
                      {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      AI 도움받기
                    </button>
                    <button
                      onClick={handleReview}
                      disabled={reviewLoading || aiLoading || !selectedProvider}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:from-amber-500/20 hover:to-orange-500/20 transition-all disabled:opacity-50"
                    >
                      {reviewLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                      {reviewLoading ? "리뷰 중..." : "AI 리뷰"}
                    </button>
                  </div>
                </div>

                {pendingAiSuggestion?.filePath === editingPost && (
                  <section
                    role="region"
                    aria-label="AI 제안 diff"
                    className="rounded-md border border-violet-500/20 bg-violet-500/5 p-3 space-y-3"
                  >
                    <div>
                      <h4 className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                        AI 제안 diff
                      </h4>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        기존 메타데이터를 바로 덮어쓰지 않아요. 변경될 내용을 확인한 뒤 적용하세요.
                      </p>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>{formatAiDiff("설명", editing.frontmatter.description, pendingAiSuggestion.suggestion.description)}</p>
                      <p>{formatAiDiff("카테고리", editing.frontmatter.categories, pendingAiSuggestion.suggestion.categories)}</p>
                      <p>{formatAiDiff("태그", editing.frontmatter.tags, pendingAiSuggestion.suggestion.tags)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={applyPendingAiSuggestion}
                        className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                      >
                        제안 적용
                      </button>
                      <button
                        onClick={() => setPendingAiSuggestion(null)}
                        className="px-3 py-1.5 rounded-md border border-border text-xs hover:bg-muted/50 transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  </section>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">제목</label>
                  <input
                    value={editing.frontmatter.title}
                    onChange={(e) => updateFrontmatter(editingPost!, { ...editing.frontmatter, title: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">설명</label>
                  <textarea
                    value={editing.frontmatter.description}
                    onChange={(e) => updateFrontmatter(editingPost!, { ...editing.frontmatter, description: e.target.value })}
                    rows={2}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <TagInput
                  label="카테고리"
                  values={editing.frontmatter.categories}
                  suggestions={allCategories}
                  onChange={(cats) => updateFrontmatter(editingPost!, { ...editing.frontmatter, categories: cats })}
                />

                <TagInput
                  label="태그"
                  values={editing.frontmatter.tags}
                  suggestions={allTags}
                  onChange={(tags) => updateFrontmatter(editingPost!, { ...editing.frontmatter, tags: tags })}
                />

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">썸네일 URL</label>
                  <div className="flex gap-2">
                    <input
                      value={editing.frontmatter.image || ""}
                      onChange={(e) => updateFrontmatter(editingPost!, { ...editing.frontmatter, image: e.target.value || undefined })}
                      placeholder="https://... 또는 /assets/img/..."
                      className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      disabled={thumbnailLoading}
                    />
                    <select
                      value={selectedThumbnailModel}
                      onChange={(e) => {
                        setSelectedThumbnailModel(e.target.value);
                        localStorage.setItem("admin-thumbnail-model", e.target.value);
                      }}
                      disabled={thumbnailLoading}
                      className="text-[10px] rounded-md border border-border bg-background px-1.5 py-1 focus:outline-none focus:ring-2 focus:ring-primary/50 max-w-[120px]"
                    >
                      {thumbnailModels.map((m) => (
                        <option key={m.id} value={m.id}>{m.displayName}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleGenerateThumbnail}
                      disabled={thumbnailLoading || aiLoading || translateLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 hover:from-purple-500/20 hover:to-pink-500/20 transition-all disabled:opacity-50 shrink-0"
                    >
                      {thumbnailLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImageIcon className="h-3 w-3" />}
                      {thumbnailLoading ? "생성 중..." : "생성하기"}
                    </button>
                  </div>
                  {thumbnailPreview.has(editingPost!) && (
                    <div className="mt-2 space-y-2">
                      <img
                        src={thumbnailPreview.get(editingPost!)}
                        alt="Generated thumbnail"
                        className="max-h-40 rounded-md border border-border cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(thumbnailPreview.get(editingPost!), "_blank")}
                        title="클릭하면 크게 보기"
                      />
                      <button
                        onClick={handleGenerateThumbnail}
                        disabled={thumbnailLoading || aiLoading || translateLoading}
                        className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        마음에 안 들면 재생성
                      </button>
                    </div>
                  )}
                  {editing.frontmatter.image && !thumbnailPreview.has(editingPost!) && (
                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1">
                        <Check className="h-3 w-3" /> 썸네일 설정됨
                      </p>
                      {editing.frontmatter.image.startsWith("/") && (
                        <button
                          onClick={() => window.open(editing.frontmatter.image, "_blank")}
                          className="text-[10px] text-primary hover:underline"
                        >
                          미리보기
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editing.includeEn}
                        onChange={(e) => updateIncludeEn(editingPost!, e.target.checked)}
                        disabled={!editing.post.hasEnVersion}
                        className="rounded border-border"
                      />
                      <div>
                        <span className="text-sm">영어 번역 포함</span>
                        {editing.post.hasEnVersion ? (
                          <span className="text-[10px] text-green-600 dark:text-green-400 ml-2">번역본 있음</span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground ml-2">번역본 없음</span>
                        )}
                      </div>
                    </label>
                    <div className="flex items-center gap-2">
                      {editing.post.hasEnVersion && editing.post.enFilePath && (
                        <button
                          onClick={() => window.open(`/posts/${editing.post.filename}-en`, "_blank")}
                          className="text-[10px] text-primary hover:underline"
                        >
                          새 탭에서 보기
                        </button>
                      )}
                      <button
                        onClick={handleTranslate}
                        disabled={translateLoading || aiLoading || thumbnailLoading || !selectedProvider}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:from-blue-500/20 hover:to-cyan-500/20 transition-all disabled:opacity-50 shrink-0"
                      >
                        {translateLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
                        {translateLoading ? "번역 중..." : editing.post.hasEnVersion ? "재번역" : "번역하기"}
                      </button>
                    </div>
                  </div>
                  {/* Translation preview */}
                  {editing.post.hasEnVersion && editing.post.enFilePath && (
                    <div className="mt-2 p-3 rounded-md border border-blue-500/20 bg-blue-500/5 max-h-48 overflow-y-auto">
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-[10px] font-medium text-muted-foreground">번역 미리보기</span>
                      </div>
                      <TranslationPreview filePath={editing.post.enFilePath} />
                    </div>
                  )}
                </div>

                {/* AI Review */}
                {reviewContent.has(editingPost!) && (
                  <div id="review-result" className="space-y-2">
                    {(() => {
                      const review = reviewContent.get(editingPost!) || "";
                      const summary = getReviewSummary(review);
                      return (
                        <section
                          role="region"
                          aria-label="AI 리뷰 발행 판단 요약"
                          className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3 space-y-2"
                        >
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {summary.score && (
                              <span className="rounded-full bg-amber-500/10 px-2 py-1 font-medium text-amber-700 dark:text-amber-300">
                                리뷰 점수 {summary.score}
                              </span>
                            )}
                            {summary.decision && (
                              <span className="rounded-full bg-primary/10 px-2 py-1 font-medium text-primary">
                                최종 판단: {summary.decision}
                              </span>
                            )}
                            {summary.hasChecklist && <span className="rounded-full bg-green-500/10 px-2 py-1 text-green-700 dark:text-green-300">체크리스트 포함</span>}
                            {summary.hasVoiceCheck && <span className="rounded-full bg-blue-500/10 px-2 py-1 text-blue-700 dark:text-blue-300">말투 점검 포함</span>}
                            {summary.hasSensitiveCheck && <span className="rounded-full bg-red-500/10 px-2 py-1 text-red-700 dark:text-red-300">민감정보 점검 포함</span>}
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            AI 리뷰를 발행 전 게이트로 사용하세요. 최종 판단이 보완/보류라면 아래 상세 리뷰를 확인한 뒤 수정하세요.
                          </p>
                        </section>
                      );
                    })()}
                    <button
                      onClick={() => setShowReview(!showReview)}
                      className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      <FileText className="h-3 w-3" />
                      AI 리뷰 결과 {showReview ? "접기" : "보기"}
                    </button>
                    {showReview && (
                      <div className="p-4 rounded-md border border-amber-500/20 bg-amber-500/5 max-h-96 overflow-y-auto">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {reviewContent.get(editingPost!) || ""}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : selectedPosts.size > 0 ? (
            <div className="rounded-lg border border-border/60 p-4 flex flex-col items-center justify-center py-12 text-center">
              <Check className="h-8 w-8 text-primary/30 mb-3" />
              <p className="text-sm text-muted-foreground">포스트를 클릭하면 메타데이터를 편집할 수 있습니다</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border/60 p-4 flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">포스트를 선택하면</p>
              <p className="text-sm text-muted-foreground">메타데이터 편집 + AI 도움을 받을 수 있습니다</p>
            </div>
          )}

          {/* Publish options */}
          {selectedPosts.size > 0 && (
            <div className="rounded-lg border border-border/60 p-4 space-y-3">
              <h3 className="text-sm font-semibold">발행 방식</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMode("direct")}
                  className={`flex items-center gap-2 p-3 rounded-md border text-sm transition-colors ${
                    mode === "direct"
                      ? "border-primary/50 bg-primary/5 text-primary"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <GitCommit className="h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">직접 커밋</div>
                    <div className="text-[10px] text-muted-foreground">main에 바로 커밋</div>
                    <div className="mt-1 text-[10px] font-medium text-red-600 dark:text-red-400">위험도 높음 · main에 바로 반영</div>
                  </div>
                </button>
                <button
                  onClick={() => setMode("pr")}
                  className={`flex items-center gap-2 p-3 rounded-md border text-sm transition-colors ${
                    mode === "pr"
                      ? "border-primary/50 bg-primary/5 text-primary"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <GitPullRequest className="h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">PR 생성</div>
                    <div className="text-[10px] text-muted-foreground">프리뷰 후 머지</div>
                  </div>
                </button>
              </div>

              {mode === "direct" && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    aria-label="발행 후 자동 푸시"
                    checked={autoPush}
                    onChange={(e) => setAutoPush(e.target.checked)}
                    className="rounded border-border"
                  />
                  <div>
                    <span className="text-sm">발행 후 자동 푸시</span>
                    <span className="text-[10px] text-muted-foreground ml-2">git push origin main</span>
                    <p className="mt-1 text-[10px] text-red-600 dark:text-red-400">
                      자동 푸시는 origin/main에 즉시 반영되어 배포를 트리거할 수 있어요.
                    </p>
                  </div>
                </label>
              )}

              {/* Quality Checklist */}
              <div className="rounded-md border border-border/40 bg-muted/30 p-3 space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">발행 품질 체크</h4>
                {(() => {
                  const checks = Array.from(selectedPosts.values()).map(({ post, frontmatter }) => {
                    const warnings = getQualityWarnings(post, frontmatter);
                    const hasThumbnail = !warnings.includes("썸네일 URL이 비어 있음");
                    const hasDescription = !warnings.includes("설명(description)이 비어 있음");
                    const hasTags = !warnings.includes("태그가 비어 있음");
                    const hasCategory = !warnings.includes("카테고리가 비어 있음");
                    const isSlugEnglish = !/[^\x00-\x7F]/.test(post.filename.replace(/\.mdx?$/, ""));

                    return {
                      title: post.title,
                      checks: [
                        { label: "썸네일 URL 입력됨", passed: hasThumbnail },
                        { label: "설명(description) 있음", passed: hasDescription },
                        { label: "태그 1개 이상", passed: hasTags },
                        { label: "카테고리 있음", passed: hasCategory },
                        { label: "slug가 영문", passed: isSlugEnglish },
                      ],
                      allPassed: hasThumbnail && hasDescription && hasTags && hasCategory && isSlugEnglish,
                    };
                  });

                  const allPostsReady = checks.every((c) => c.allPassed);

                  return (
                    <div className="space-y-2">
                      {checks.map((check, idx) => (
                        <div key={idx} className="text-xs">
                          {checks.length > 1 && (
                            <div className="font-medium text-foreground mb-1 truncate">{check.title}</div>
                          )}
                          <div className="grid grid-cols-1 gap-1">
                            {check.checks.map((item, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className={item.passed ? "text-green-600 dark:text-green-500" : "text-yellow-600 dark:text-yellow-500"}>
                                  {item.passed ? "✅" : "⚠️"}
                                </span>
                                <span className={item.passed ? "text-muted-foreground" : "text-yellow-700 dark:text-yellow-400"}>
                                  {item.label}
                                </span>
                              </div>
                            ))}
                          </div>
                          {idx < checks.length - 1 && <div className="border-t border-border/30 mt-2 pt-1" />}
                        </div>
                      ))}
                      <div className={`mt-3 pt-3 border-t border-border/40 text-xs font-medium ${allPostsReady ? "text-green-600 dark:text-green-500" : "text-yellow-600 dark:text-yellow-500"}`}>
                        {allPostsReady ? "✅ 발행 준비 완료" : "⚠️ 일부 항목 미충족 (발행 가능)"}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <section
                role="region"
                aria-label="발행 dry-run 요약"
                className="rounded-md border border-blue-500/20 bg-blue-500/5 p-3 space-y-2 text-xs"
              >
                <h4 className="font-semibold text-blue-700 dark:text-blue-300">발행 dry-run 요약</h4>
                <p>실행 방식: {getPublishActionLabel(mode, autoPush)}</p>
                <p>선택한 포스트 {selectedPosts.size}개</p>
                <div className="space-y-1 text-muted-foreground">
                  {Array.from(selectedPosts.values()).map(({ post }) => {
                    const generated = generatedFiles.get(post.filePath) || [];
                    return (
                      <div key={post.filePath} className="space-y-0.5">
                        <p>커밋 대상: {post.filePath}</p>
                        {generated.length > 0 && <p>생성 파일: {generated.join(", ")}</p>}
                      </div>
                    );
                  })}
                </div>
              </section>

              <button
                onClick={() => setShowPublishConfirm(true)}
                disabled={publishing}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full justify-center"
              >
                {publishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : mode === "pr" ? (
                  <GitPullRequest className="h-4 w-4" />
                ) : (
                  <Rocket className="h-4 w-4" />
                )}
                {mode === "pr" ? `PR 생성 (${selectedPosts.size}개)` : (() => {
                  const allModified = Array.from(selectedPosts.values()).every((s) => s.post.gitStatus === "modified");
                  return allModified ? `수정하기 (${selectedPosts.size}개)` : `발행하기 (${selectedPosts.size}개)`;
                })()}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Post Content Preview Dialog */}
      <Dialog open={Boolean(previewPost)} onOpenChange={(open) => !open && setPreviewPost(null)}>
        <DialogContent className="flex h-[96vh] w-[calc(100vw-0.75rem)] max-w-[1400px] grid-rows-none flex-col gap-0 overflow-hidden p-0 sm:h-[92vh] sm:w-[calc(100vw-2rem)] sm:max-w-[1400px]">
          <DialogHeader className="border-b border-border/60 px-5 py-4 sm:px-6">
            <DialogTitle className="truncate pr-8">{previewPost?.title || "본문 미리보기"}</DialogTitle>
            <DialogDescription className="truncate">{previewPost?.filePath}</DialogDescription>
          </DialogHeader>
          <div
            aria-label="블로그 실제 레이아웃 미리보기"
            className="min-h-0 flex-1 overflow-y-auto bg-muted/20"
            role="region"
          >
            <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
              <div className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_220px]">
                <article className="min-w-0 rounded-xl border border-border/40 bg-background p-6 shadow-sm sm:p-8 lg:p-10">
                  {previewPost && <PostContentPreview key={previewPost.filePath} filePath={previewPost.filePath} />}
                </article>
                <aside className="hidden self-start rounded-xl border border-border/40 bg-background/70 p-4 text-xs text-muted-foreground xl:block">
                  <p className="font-medium text-foreground">미리보기</p>
                  <p className="mt-2 leading-relaxed">
                    실제 글 페이지처럼 본문 폭과 사이드 여백을 맞춰 보여줍니다.
                  </p>
                </aside>
              </div>
            </div>
          </div>
          <DialogFooter className="mx-0 mb-0 rounded-none border-t bg-background/95 px-5 py-4 sm:px-6">
            <Button variant="outline" onClick={() => setPreviewPost(null)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish Confirmation Dialog */}
      <Dialog open={showPublishConfirm} onOpenChange={setShowPublishConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {mode === "pr" ? "PR 생성 확인" : "발행 확인"}
            </DialogTitle>
            <DialogDescription>
              {mode === "pr"
                ? "다음 포스트로 PR을 생성합니다."
                : autoPush
                  ? "다음 포스트를 발행하고 자동으로 푸시합니다."
                  : "다음 포스트를 발행합니다."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4 max-h-[400px] overflow-y-auto">
            <div className={`rounded-md border p-3 text-xs ${mode === "direct" ? "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300" : "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300"}`}>
              실행 예정: {getPublishActionLabel(mode, autoPush)}
            </div>
            {Array.from(selectedPosts.values()).map(({ post, frontmatter, includeEn }) => (
              <div key={post.filePath} className="rounded-md border border-border/40 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    post.gitStatus === "new" ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600"
                  }`}>
                    {post.gitStatus === "new" ? "NEW" : "MOD"}
                  </span>
                  <span className="font-medium text-sm">{frontmatter.title}</span>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <div>파일: {post.filename}</div>
                  {frontmatter.image && (
                    <div className="flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" />
                      썸네일 포함
                    </div>
                  )}
                  {includeEn && (
                    <div className="flex items-center gap-1">
                      <Languages className="h-3 w-3" />
                      영문 번역 포함
                    </div>
                  )}
                  {generatedFiles.get(post.filePath) && generatedFiles.get(post.filePath)!.length > 0 && (
                    <div className="text-[10px] text-blue-600 dark:text-blue-400">
                      생성된 파일 {generatedFiles.get(post.filePath)!.length}개 포함
                    </div>
                  )}
                  {(() => {
                    const warnings = getQualityWarnings(post, frontmatter);
                    if (warnings.length === 0) return null;
                    return (
                      <div className="text-[10px] text-yellow-700 dark:text-yellow-400">
                        경고 {warnings.length}개: {warnings.join(", ")}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPublishConfirm(false)}
              disabled={publishing}
            >
              취소
            </Button>
            <Button
              onClick={() => {
                setShowPublishConfirm(false);
                handlePublish();
              }}
              disabled={publishing}
            >
              {publishing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {mode === "pr" ? "PR 생성 중..." : "발행 중..."}
                </>
              ) : (
                <>
                  {mode === "pr" ? (
                    <GitPullRequest className="h-4 w-4 mr-2" />
                  ) : (
                    <Rocket className="h-4 w-4 mr-2" />
                  )}
                  확인
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
