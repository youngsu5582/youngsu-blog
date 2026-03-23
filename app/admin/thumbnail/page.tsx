"use client";

import { useState, useEffect, useMemo } from "react";
import { Image as ImageIcon, Loader2, Sparkles, Save, Search, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";

interface PostInfo {
  filePath: string;
  filename: string;
  title: string;
  categories: string[];
  tags: string[];
}

interface ModelInfo {
  id: string;
  displayName: string;
  description: string;
}

export default function ThumbnailPage() {
  const [posts, setPosts] = useState<PostInfo[]>([]);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>("");
  const [generationMethod, setGenerationMethod] = useState<string>("");
  const [filename, setFilename] = useState("");
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [postSearch, setPostSearch] = useState("");
  const [showPostPicker, setShowPostPicker] = useState(false);

  useEffect(() => {
    // Fetch posts
    fetch("/api/admin/content?file=_posts")
      .then((r) => r.json())
      .then((data) => {
        const allPosts = (data.posts || []) as PostInfo[];
        // Filter out English posts
        const koreanPosts = allPosts.filter((p) => !p.filename.endsWith("-en"));
        setPosts(koreanPosts);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Fetch models
    fetch("/api/admin/thumbnail/models")
      .then((r) => r.json())
      .then((data) => {
        const modelList = data.models || [];
        setModels(modelList);

        // Load saved preference or default to first model
        const saved = localStorage.getItem("admin-thumbnail-model");
        if (saved && modelList.some((m: ModelInfo) => m.id === saved)) {
          setSelectedModel(saved);
        } else if (modelList.length > 0) {
          setSelectedModel(modelList[0].id);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch models:", err);
        // Fallback to default model
        setSelectedModel("gemini-2.5-flash-image");
      });
  }, []);

  const handleGenerate = async () => {
    if (!selectedPost) {
      setResult({ success: false, message: "포스트를 선택하세요" });
      return;
    }

    setGenerating(true);
    setResult(null);
    setGeneratedImage(null);
    setGeneratedPrompt("");
    setGenerationMethod("");

    try {
      const res = await fetch("/api/admin/thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath: selectedPost,
          model: selectedModel,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setGeneratedImage(data.base64);
        setGeneratedPrompt(data.prompt || "");
        setGenerationMethod(data.method || "");

        // Set default filename from post slug
        const postInfo = posts.find((p) => p.filePath === selectedPost);
        if (postInfo) {
          setFilename(postInfo.filename);
        }

        setResult({
          success: true,
          message: `썸네일 생성 완료 (${data.method}) — 저장하려면 아래 버튼을 클릭하세요`,
        });
      } else {
        setResult({ success: false, message: data.error || "생성 실패" });
      }
    } catch (err: any) {
      setResult({ success: false, message: err.message || "생성 실패" });
    }

    setGenerating(false);
  };

  const handleSave = async () => {
    if (!generatedImage || !filename.trim()) {
      setResult({ success: false, message: "파일명을 입력하세요" });
      return;
    }

    setSaving(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/thumbnail/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64: generatedImage,
          filename: filename.trim(),
          originalPath: selectedPost,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const message = data.frontmatterUpdated
          ? `저장 완료: ${data.filePath} (frontmatter 자동 업데이트됨)`
          : `저장 완료: ${data.filePath}`;
        setResult({
          success: true,
          message,
        });
      } else {
        setResult({ success: false, message: data.error || "저장 실패" });
      }
    } catch (err: any) {
      setResult({ success: false, message: err.message || "저장 실패" });
    }

    setSaving(false);
  };

  const filteredPosts = useMemo(() => {
    if (!postSearch.trim()) return posts;
    const q = postSearch.toLowerCase();
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.filename.toLowerCase().includes(q)
    );
  }, [posts, postSearch]);

  const selectedPostInfo = posts.find((p) => p.filePath === selectedPost);

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
        <h2 className="text-xl font-semibold">썸네일 생성기</h2>
        <p className="text-sm text-muted-foreground mt-1">
          AI 모델로 포스트 썸네일을 자동 생성합니다
        </p>
      </div>

      {result && (
        <div
          className={`rounded-lg p-3 text-sm flex items-start gap-2 ${
            result.success
              ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
              : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
          }`}
        >
          {result.success ? (
            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          )}
          <span>{result.message}</span>
        </div>
      )}

      {/* Controls */}
      <div className="rounded-lg border border-border/60 p-4 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            포스트 선택
          </label>
          <div className="relative">
            <button
              onClick={() => !generating && setShowPostPicker(!showPostPicker)}
              disabled={generating}
              className="w-full text-left rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            >
              {selectedPostInfo ? (
                <span>{selectedPostInfo.title}</span>
              ) : (
                <span className="text-muted-foreground">포스트를 선택하세요</span>
              )}
            </button>

            {showPostPicker && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowPostPicker(false)}
                />
                <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-md border border-border bg-popover shadow-lg max-h-80 flex flex-col">
                  <div className="p-2 border-b border-border/40">
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
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {filteredPosts.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        {postSearch ? "검색 결과가 없습니다" : "포스트가 없습니다"}
                      </div>
                    ) : (
                      filteredPosts.map((post) => (
                        <button
                          key={post.filePath}
                          onClick={() => {
                            setSelectedPost(post.filePath);
                            setShowPostPicker(false);
                            setPostSearch("");
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${
                            selectedPost === post.filePath ? "bg-accent" : ""
                          }`}
                        >
                          <span className="truncate">{post.title}</span>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t border-border/40 text-[10px] text-muted-foreground">
                    {filteredPosts.length}개 포스트
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            이미지 생성 모델
          </label>
          <select
            value={selectedModel}
            onChange={(e) => {
              setSelectedModel(e.target.value);
              localStorage.setItem("admin-thumbnail-model", e.target.value);
            }}
            disabled={generating}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          >
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.displayName}
              </option>
            ))}
          </select>
          {selectedModel && models.find((m) => m.id === selectedModel) && (
            <p className="text-[10px] text-muted-foreground">
              {models.find((m) => m.id === selectedModel)?.description}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleGenerate}
            disabled={generating || !selectedPost}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-gradient-to-r from-violet-500/10 to-blue-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 hover:from-violet-500/20 hover:to-blue-500/20 transition-all disabled:opacity-50 text-sm font-medium"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {generating ? "생성 중... (10-30초 소요)" : "생성하기"}
          </button>

          {generatedImage && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-border text-sm hover:bg-accent transition-colors disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              재생성
            </button>
          )}
        </div>

        {generating && (
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>이미지 생성에는 시간이 걸릴 수 있습니다. 잠시만 기다려주세요.</span>
          </div>
        )}
      </div>

      {/* Generated Image */}
      {generatedImage && (
        <div className="rounded-lg border border-border/60 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              생성된 썸네일
            </h3>
            {generationMethod && (
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                {generationMethod}
              </span>
            )}
          </div>

          <div className="rounded-md border border-border overflow-hidden bg-muted/30">
            <img
              src={`data:image/png;base64,${generatedImage}`}
              alt="Generated thumbnail"
              className="w-full h-auto"
            />
          </div>

          {generatedPrompt && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                사용된 프롬프트
              </label>
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground max-h-24 overflow-y-auto">
                {generatedPrompt}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              파일명 (확장자 제외)
            </label>
            <input
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="예: my-post-thumbnail"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-[10px] text-muted-foreground">
              저장 경로: /assets/img/thumbnail/{filename || "(파일명)"}.png
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !filename.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm font-medium w-full justify-center"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "저장 중..." : "저장하기"}
          </button>
        </div>
      )}

    </div>
  );
}
