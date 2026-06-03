"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Loader2, Save, FileText, BookOpen, StickyNote, Library, Eye, EyeOff, X, Search, Archive, ChevronDown, Clock, Plus } from "lucide-react";
import { TagInput } from "@/components/admin/tag-input";
import { MarkdownToolbar } from "@/components/admin/markdown-toolbar";
import { attachImageUploadHandlers } from "@/components/admin/image-upload-handler";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const COLLECTIONS = [
  { id: "posts", label: "포스트", icon: FileText },
  { id: "articles", label: "아티클", icon: BookOpen },
  { id: "notes", label: "노트", icon: StickyNote },
  { id: "library", label: "서재", icon: Library },
];

const TEMPLATES = [
  {
    id: "empty",
    label: "빈 포스트",
    collection: "posts",
    categories: [],
    content: "",
  },
  {
    id: "learning-note",
    label: "학습 노트",
    collection: "notes",
    categories: ["학습"],
    content: `## 주제

학습한 내용의 핵심 개념을 정리합니다.

## 정리

- 주요 포인트 1
- 주요 포인트 2
- 주요 포인트 3

## 참고

- 관련 링크나 레퍼런스
`,
  },
  {
    id: "good-code",
    label: "Good Code",
    collection: "posts",
    categories: ["Good Code"],
    content: `## 상황

코드 리뷰를 진행하게 된 배경과 상황을 설명합니다.

## 문제

기존 코드의 문제점이나 개선이 필요한 부분을 설명합니다.

\`\`\`java
// 기존 코드 예시
\`\`\`

## 개선

개선된 코드와 그 이유를 설명합니다.

\`\`\`java
// 개선된 코드
\`\`\`

## 정리

- 핵심 개선 사항
- 적용 가능한 원칙
- 주의사항
`,
  },
  {
    id: "tech-article",
    label: "기술 아티클",
    collection: "articles",
    categories: ["기술"],
    content: `## 개요

글의 주제와 배경을 간단히 소개합니다.

## 배경

문제 상황이나 해당 기술이 필요한 이유를 설명합니다.

## 구현

기술적인 세부 내용이나 구현 과정을 설명합니다.

\`\`\`java
// 코드 예시
\`\`\`

## 결론

핵심 내용을 정리하고 얻은 인사이트를 공유합니다.
`,
  },
  {
    id: "book-review",
    label: "책 리뷰",
    collection: "library",
    categories: ["독서"],
    content: `## 책 정보

- 저자:
- 출판사:
- 출판년도:

## 핵심 내용

책의 주요 내용과 핵심 메시지를 요약합니다.

## 인상 깊었던 부분

> 인용문이나 특별히 기억에 남는 내용

## 나의 생각

책을 읽고 느낀 점, 적용해볼 만한 내용 등을 정리합니다.

## 평가

- 추천 대상:
- 별점: ⭐⭐⭐⭐⭐
`,
  },
];

const DRAFTS_KEY = "admin-write-drafts";
const MAX_DRAFTS = 10;
const AUTOSAVE_DELAY = 5000; // 5 seconds
const NEW_POST_CONFIRM_MESSAGE = "작성 중인 내용이 있습니다. 새 글로 초기화할까요?";
const SLUG_VALIDATION_MESSAGE = "Slug는 한글/영문 소문자/숫자/하이픈만 사용할 수 있고, / 또는 ..은 사용할 수 없어요.";

function validateSlug(value: string) {
  if (!value) return null;
  if (value.includes("/") || value.includes("..") || /\s/.test(value)) return SLUG_VALIDATION_MESSAGE;
  if (!/^[a-z0-9가-힣]+(?:-[a-z0-9가-힣]+)*$/.test(value)) return SLUG_VALIDATION_MESSAGE;
  return null;
}

interface PostItem { slug: string; title: string; collection: string; }

interface Draft {
  id: string;
  title: string;
  collection: string;
  slug: string;
  savedAt: string;
  slugManual: boolean;
  description: string;
  categories: string[];
  tags: string[];
  thumbnail: string;
  relatedSlugs: string[];
  content: string;
}

export default function WritePage() {
  const [content, setContent] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [showMeta, setShowMeta] = useState(false);

  const [collection, setCollection] = useState("posts");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [thumbnail, setThumbnail] = useState("");
  const [relatedSlugs, setRelatedSlugs] = useState<string[]>([]);

  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [allPosts, setAllPosts] = useState<PostItem[]>([]);
  const [relatedSearch, setRelatedSearch] = useState("");
  const [showRelatedPicker, setShowRelatedPicker] = useState(false);

  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Auto-save state
  const [autoSaveTime, setAutoSaveTime] = useState<string | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Multi-draft state
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [showDraftPicker, setShowDraftPicker] = useState(false);
  const [pendingRestoreDraft, setPendingRestoreDraft] = useState<Draft | null>(null);
  const slugError = validateSlug(slug);

  // Template picker state
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);

  // Textarea ref for markdown toolbar
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Attach image upload handlers to textarea
  useEffect(() => {
    const cleanup = attachImageUploadHandlers(textareaRef.current, {
      onUploadStart: () => {
        setResult({ success: true, message: "이미지 업로드 중..." });
      },
      onUploadComplete: (imageUrl) => {
        setResult({ success: true, message: `이미지 업로드 완료: ${imageUrl}` });
        setTimeout(() => setResult(null), 2000);
      },
      onUploadError: (error) => {
        setResult({ success: false, message: error });
        setTimeout(() => setResult(null), 3000);
      },
    });

    return cleanup;
  }, []);

  // Save drafts to localStorage
  const saveDraftsToStorage = useCallback((newDrafts: Draft[]) => {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(newDrafts));
    setDrafts(newDrafts);
  }, []);

  // Auto-save function — saves directly into drafts
  const performAutoSave = useCallback(() => {
    const identifier = slug || title;
    if (!identifier) return;

    const now = new Date();
    const newDraft: Draft = {
      id: Date.now().toString(),
      title: title || "(제목 없음)",
      collection,
      slug,
      savedAt: now.toISOString(),
      slugManual,
      description,
      categories,
      tags,
      thumbnail,
      relatedSlugs,
      content,
    };

    // Read current drafts from localStorage directly (avoid stale closure)
    let currentDrafts: Draft[] = [];
    try {
      const raw = localStorage.getItem(DRAFTS_KEY);
      if (raw) currentDrafts = JSON.parse(raw) || [];
    } catch {}

    const existingIndex = currentDrafts.findIndex(d =>
      (slug && d.slug === slug) || (!slug && d.title === title)
    );

    if (existingIndex >= 0) {
      currentDrafts[existingIndex] = { ...newDraft, id: currentDrafts[existingIndex].id };
    } else {
      currentDrafts.push(newDraft);
    }

    if (currentDrafts.length > MAX_DRAFTS) {
      currentDrafts = currentDrafts.slice(-MAX_DRAFTS);
    }

    localStorage.setItem(DRAFTS_KEY, JSON.stringify(currentDrafts));
    setDrafts(currentDrafts);
    setAutoSaveTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`);
  }, [collection, title, slug, slugManual, description, categories, tags, thumbnail, relatedSlugs, content]);

  // Debounced auto-save effect
  useEffect(() => {
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer (only if there's content to save)
    if (content || title || description) {
      autoSaveTimerRef.current = setTimeout(() => {
        performAutoSave();
      }, AUTOSAVE_DELAY);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [content, title, slug, collection, description, categories, tags, thumbnail, relatedSlugs, performAutoSave]);

  // Save immediately on page unload (dev watch reload, tab close)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (content || title || description) {
        performAutoSave();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [performAutoSave, content, title, description]);

  // Restore most recent draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFTS_KEY);
      if (raw) {
        const parsed: Draft[] = JSON.parse(raw) || [];
        setDrafts(parsed);
        if (parsed.length > 0) {
          // Offer the most recently saved draft instead of overwriting an empty new post automatically.
          const latest = parsed.reduce((a, b) =>
            new Date(a.savedAt) > new Date(b.savedAt) ? a : b
          );
          setPendingRestoreDraft(latest);
        }
      }
    } catch {
      setDrafts([]);
    }
  }, []);

  // Load a specific draft
  const loadDraft = (draft: Draft) => {
    setCollection(draft.collection);
    setTitle(draft.title === "(제목 없음)" ? "" : draft.title);
    setSlug(draft.slug);
    setSlugManual(draft.slugManual);
    setDescription(draft.description);
    setCategories(draft.categories);
    setTags(draft.tags);
    setThumbnail(draft.thumbnail);
    setRelatedSlugs(draft.relatedSlugs);
    setContent(draft.content);
    setPendingRestoreDraft(null);
    setShowDraftPicker(false);
    setResult({ success: true, message: "임시저장 불러옴" });
    setTimeout(() => setResult(null), 2000);
  };

  // Delete a specific draft
  const deleteDraft = (id: string) => {
    const updatedDrafts = drafts.filter(d => d.id !== id);
    saveDraftsToStorage(updatedDrafts);
  };

  const hasDraftContent = useCallback(() => (
    Boolean(content.trim()) ||
    Boolean(title.trim()) ||
    Boolean(description.trim()) ||
    categories.length > 0 ||
    tags.length > 0 ||
    Boolean(thumbnail.trim()) ||
    relatedSlugs.length > 0
  ), [content, title, description, categories, tags, thumbnail, relatedSlugs]);

  const commitTemplate = (templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    setCollection(template.collection);
    setCategories(template.categories);
    setContent(template.content);
    setTitle("");
    setSlug("");
    setSlugManual(false);
    setDescription("");
    setTags([]);
    setThumbnail("");
    setRelatedSlugs([]);
    setPendingTemplateId(null);
    setShowTemplatePicker(false);
    setResult({ success: true, message: `템플릿 적용: ${template.label}` });
    setTimeout(() => setResult(null), 2000);
  };

  // Apply a template
  const applyTemplate = (templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    if (hasDraftContent()) {
      setPendingTemplateId(templateId);
      return;
    }

    commitTemplate(templateId);
  };

  // Get relative time string
  const getRelativeTime = (isoString: string): string => {
    const now = new Date();
    const saved = new Date(isoString);
    const diffMs = now.getTime() - saved.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "방금 전";
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays === 1) return "어제";
    if (diffDays < 7) return `${diffDays}일 전`;
    return saved.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  // Auto-generate slug from title (unless manually edited)
  useEffect(() => {
    if (!slugManual && title) {
      const auto = title
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      setSlug(auto);
    }
  }, [title, slugManual]);

  useEffect(() => {
    fetch("/api/admin/content?file=_taxonomies")
      .then((r) => r.json())
      .then((data) => {
        if (data.categories) setAllCategories(data.categories);
        if (data.tags) setAllTags(data.tags);
      }).catch(() => {});

    fetch("/api/admin/content")
      .then((r) => r.json())
      .then((data) => {
        if (data.items) setAllPosts(data.items);
      }).catch(() => {});
  }, []);

  const filteredPosts = useMemo(() => {
    if (!relatedSearch) return allPosts.filter((p) => !relatedSlugs.includes(p.slug)).slice(0, 8);
    return allPosts
      .filter((p) => !relatedSlugs.includes(p.slug) && (p.title.toLowerCase().includes(relatedSearch.toLowerCase()) || p.slug.includes(relatedSearch.toLowerCase())))
      .slice(0, 8);
  }, [allPosts, relatedSearch, relatedSlugs]);

  const resetDraft = useCallback(() => {
    setCollection("posts");
    setTitle("");
    setSlug("");
    setSlugManual(false);
    setDescription("");
    setCategories([]);
    setTags([]);
    setThumbnail("");
    setRelatedSlugs([]);
    setContent("");
    setAutoSaveTime(null);
    setResult(null);
  }, []);

  const handleSave = async () => {
    if (!title.trim()) { setResult({ success: false, message: "제목을 입력하세요" }); return; }
    if (slugError) { setResult({ success: false, message: slugError }); return; }
    setSaving(true); setResult(null);
    try {
      const res = await fetch("/api/admin/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection, title, slug: slug || undefined, description, categories, tags, thumbnail, content, related: relatedSlugs }),
      });
      const data = await res.json();
      if (data.success) {
        // Clear saved draft on successful publish
        const savedSlug = slug || title;
        if (savedSlug) {
          const updatedDrafts = drafts.filter(d =>
            !(slug && d.slug === slug) && !(!slug && d.title === title)
          );
          saveDraftsToStorage(updatedDrafts);
        }
        setAutoSaveTime(null);
        setResult({ success: true, message: `저장 완료: ${data.filePath}` });
      }
      else { setResult({ success: false, message: data.error }); }
    } catch { setResult({ success: false, message: "저장 실패" }); }
    setSaving(false);
  };

  const pendingTemplate = pendingTemplateId ? TEMPLATES.find(t => t.id === pendingTemplateId) : null;
  const summarizeText = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "(비어 있음)";
    return trimmed.length > 80 ? `${trimmed.slice(0, 80)}...` : trimmed;
  };
  const summarizeList = (values: string[]) => values.length > 0 ? values.join(", ") : "(비어 있음)";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">간편 작성기</h2>
          <p className="text-sm text-muted-foreground mt-1">마크다운으로 작성하고 저장</p>
        </div>
        <div className="flex items-center gap-2">
          {/* 새 글 작성 */}
          <button
            onClick={() => {
              if (hasDraftContent() && !confirm(NEW_POST_CONFIRM_MESSAGE)) return;
              resetDraft();
            }}
            className="text-xs px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors flex items-center gap-1.5"
          >
            <Plus className="h-3 w-3" />
            새 글
          </button>

          {/* Auto-save indicator */}
          {autoSaveTime && (
            <div className="text-[10px] text-muted-foreground/60 flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50">
              <Clock className="h-3 w-3" />
              자동 저장됨 ({autoSaveTime})
            </div>
          )}

          {/* Multi-draft picker */}
          <div className="relative">
            <button
              onClick={() => setShowDraftPicker(!showDraftPicker)}
              className="text-xs px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <Archive className="h-3 w-3" />
              임시저장 불러오기
              {drafts.length > 0 && (
                <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-medium rounded-full bg-primary/20 text-primary">
                  {drafts.length}
                </span>
              )}
              <ChevronDown className="h-3 w-3" />
            </button>

            {showDraftPicker && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDraftPicker(false)} />
                <div className="absolute right-0 top-full mt-1 w-80 max-h-96 overflow-y-auto rounded-md border border-border bg-popover shadow-lg z-20">
                  {drafts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      저장된 임시저장이 없습니다
                    </div>
                  ) : (
                    <div className="py-1">
                      {drafts.map((draft) => {
                        const collectionLabel = COLLECTIONS.find(c => c.id === draft.collection)?.label || draft.collection;
                        return (
                          <div
                            key={draft.id}
                            className="group flex items-start gap-2 px-3 py-2 hover:bg-accent transition-colors"
                          >
                            <button
                              onClick={() => loadDraft(draft)}
                              className="flex-1 text-left min-w-0"
                            >
                              <div className="text-sm font-medium truncate">
                                {draft.title || "(제목 없음)"}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                  {collectionLabel}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {getRelativeTime(draft.savedAt)}
                                </span>
                              </div>
                            </button>
                            <button
                              onClick={() => deleteDraft(draft.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <button onClick={() => setShowMeta(!showMeta)}
            className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${showMeta ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
            메타데이터 {showMeta ? "접기" : "펼치기"}
          </button>
          <button onClick={() => setShowPreview(!showPreview)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground border border-border transition-colors">
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {pendingRestoreDraft && (
        <section
          role="region"
          aria-label="임시글 복원 안내"
          className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-sm text-blue-700 dark:text-blue-300 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            저장된 임시글 <span className="font-medium">{pendingRestoreDraft.title}</span>이 있어요. 현재 새 글을 덮어쓰지 않고 필요할 때만 복원할 수 있어요.
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => loadDraft(pendingRestoreDraft)}
              className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              임시글 복원
            </button>
            <button
              type="button"
              onClick={() => setPendingRestoreDraft(null)}
              className="px-3 py-1.5 rounded-md border border-blue-500/30 hover:bg-blue-500/10"
            >
              무시
            </button>
          </div>
        </section>
      )}

      {result && (
        <div className={`rounded-lg p-3 text-sm ${result.success ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"}`}>
          {result.message}
        </div>
      )}

      {pendingTemplate && (
        <section
          role="region"
          aria-label="템플릿 적용 diff"
          className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200 space-y-3"
        >
          <div>
            <h3 className="font-medium">템플릿 적용 전 확인</h3>
            <p className="text-xs opacity-80 mt-1">현재 작성 중인 내용을 바로 덮어쓰지 않고 변경될 항목을 먼저 보여줘요.</p>
          </div>
          <div className="space-y-1 text-xs font-mono">
            <p>컬렉션: {collection} → {pendingTemplate.collection}</p>
            <p>카테고리: {summarizeList(categories)} → {summarizeList(pendingTemplate.categories)}</p>
            <p>본문: {summarizeText(content)} → {summarizeText(pendingTemplate.content)}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => commitTemplate(pendingTemplate.id)}
              className="px-3 py-1.5 rounded-md bg-amber-600 text-white hover:bg-amber-700"
            >
              템플릿 적용
            </button>
            <button
              type="button"
              onClick={() => setPendingTemplateId(null)}
              className="px-3 py-1.5 rounded-md border border-amber-500/30 hover:bg-amber-500/10"
            >
              취소
            </button>
          </div>
        </section>
      )}

      {/* Template Picker */}
      <div className="rounded-lg border border-border/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-medium">템플릿 선택</h3>
            <p className="text-xs text-muted-foreground mt-0.5">미리 정의된 구조로 빠르게 시작하기</p>
          </div>
          <button
            onClick={() => setShowTemplatePicker(!showTemplatePicker)}
            className="text-xs px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            {showTemplatePicker ? "접기" : "펼치기"}
            <ChevronDown className={`h-3 w-3 transition-transform ${showTemplatePicker ? "rotate-180" : ""}`} />
          </button>
        </div>

        {showTemplatePicker && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {TEMPLATES.map((template) => {
              const collectionInfo = COLLECTIONS.find(c => c.id === template.collection);
              const Icon = collectionInfo?.icon || FileText;
              return (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template.id)}
                  className="flex flex-col items-start gap-1.5 px-3 py-2.5 rounded-lg border border-border hover:border-primary/50 hover:bg-accent transition-all text-left group"
                >
                  <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-foreground transition-colors">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">{template.label}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {collectionInfo?.label}
                    </span>
                    {template.categories.map(cat => (
                      <span key={cat} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                        {cat}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Metadata (collapsible) */}
      {showMeta && (
        <div className="rounded-lg border border-border/60 p-4 space-y-4">
          {/* Collection */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {COLLECTIONS.map((col) => {
              const Icon = col.icon;
              return (
                <button key={col.id} onClick={() => setCollection(col.id)}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all ${collection === col.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                  <Icon className="h-3.5 w-3.5" />{col.label}
                </button>
              );
            })}
          </div>

          {/* Title + Slug */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">제목 *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="한글 제목 가능"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Slug (파일명)</label>
              <input value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
                aria-invalid={!!slugError}
                aria-describedby={slugError ? "write-slug-error" : "write-slug-preview"}
                placeholder="영문-kebab-case (자동 생성)"
                className={`w-full rounded-md border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 ${slugError ? "border-red-500/60 focus:ring-red-500/40" : "border-border focus:ring-primary/50"}`} />
              {slugError ? (
                <p id="write-slug-error" className="text-[10px] text-red-600 dark:text-red-400">{slugError}</p>
              ) : (
                <p id="write-slug-preview" className="text-[10px] text-muted-foreground/50">파일: content/{collection}/{slug || "..."}.mdx</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">설명</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="간단한 설명 (SEO용)"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>

          {/* Categories + Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TagInput label="카테고리" values={categories} suggestions={allCategories} onChange={setCategories} />
            <TagInput label="태그" values={tags} suggestions={allTags} onChange={setTags} />
          </div>

          {/* Thumbnail */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">썸네일 URL</label>
            <input value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} placeholder="https://... 또는 /assets/img/..."
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>

          {/* Related Posts Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">관련 포스트</label>
            {/* Selected */}
            {relatedSlugs.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {relatedSlugs.map((s) => {
                  const post = allPosts.find((p) => p.slug === s);
                  return (
                    <span key={s} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {post?.title || s}
                      <button onClick={() => setRelatedSlugs((prev) => prev.filter((x) => x !== s))} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={relatedSearch}
                onChange={(e) => { setRelatedSearch(e.target.value); setShowRelatedPicker(true); }}
                onFocus={() => setShowRelatedPicker(true)}
                onBlur={() => setTimeout(() => setShowRelatedPicker(false), 200)}
                placeholder="포스트 검색하여 추가..."
                className="w-full pl-8 rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              {showRelatedPicker && filteredPosts.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-md border border-border bg-popover shadow-md">
                  {filteredPosts.map((p) => (
                    <button key={p.slug}
                      onMouseDown={(e) => { e.preventDefault(); setRelatedSlugs((prev) => [...prev, p.slug]); setRelatedSearch(""); }}
                      className="w-full text-left text-xs px-3 py-2 hover:bg-accent transition-colors flex items-center justify-between">
                      <span className="truncate">{p.title}</span>
                      <span className="text-[10px] text-muted-foreground/50 ml-2 flex-shrink-0">{p.collection}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Editor + Preview */}
      <div className={`grid gap-4 ${showPreview ? "grid-cols-1 lg:grid-cols-[1.2fr_1fr]" : "grid-cols-1"}`} style={{ minHeight: "60vh" }}>
        <div className="flex flex-col overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm transition-shadow focus-within:border-primary/40 focus-within:shadow-md">
          <div className="flex items-start justify-between gap-3 border-b border-border/40 bg-muted/30 px-3 py-2">
            <div>
              <span className="text-xs font-medium text-muted-foreground">마크다운</span>
              <p className="mt-0.5 text-[10px] text-muted-foreground/50">이미지는 붙여넣기/드롭으로 업로드할 수 있어요.</p>
            </div>
            <span className="rounded-full bg-background/70 px-2 py-0.5 text-[10px] text-muted-foreground/60 ring-1 ring-border/40">
              {content.length.toLocaleString()}자 · 약 {Math.max(1, Math.ceil(content.length / 500))}분
            </span>
          </div>
          <MarkdownToolbar textareaRef={textareaRef} value={content} onChange={setContent} />
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck={false}
            placeholder={"마크다운으로 작성하세요...\n\n## 소제목\n\n본문 내용을 자유롭게 작성하세요.\n\n- 리스트 아이템\n\n```java\npublic class Hello {}\n```"}
            className="min-h-[52vh] flex-1 w-full bg-background px-4 py-4 text-sm font-mono leading-relaxed resize-none focus:outline-none"
          />
        </div>
        {showPreview && (
          <div className="flex flex-col rounded-lg border border-border/60 overflow-hidden">
            <div className="px-3 py-2 border-b border-border/40 bg-muted/30">
              <span className="text-xs font-medium text-muted-foreground">미리보기</span>
            </div>
            <div className="flex-1 px-4 py-3 prose prose-sm prose-neutral dark:prose-invert max-w-none overflow-y-auto">
              {content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              ) : (
                <p className="text-muted-foreground text-sm">내용을 입력하면 미리보기가 표시됩니다.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom: title + save */}
      <div className="flex items-center gap-3">
        {!showMeta && (
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목을 입력하세요 *"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        )}
        <button onClick={handleSave} disabled={saving || !title.trim() || !!slugError}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          저장하기
        </button>
      </div>
    </div>
  );
}
