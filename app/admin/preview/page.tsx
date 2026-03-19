"use client";

import { useState, useEffect } from "react";
import { Loader2, ExternalLink } from "lucide-react";

interface ContentItem {
  slug: string;
  title: string;
  collection: string;
  date: string;
}

export default function PreviewPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/content")
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = items.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.slug.toLowerCase().includes(search.toLowerCase())
  );

  const getPreviewUrl = (item: ContentItem) => {
    const collectionPrefix = item.collection === "posts" ? "posts" :
                            item.collection === "articles" ? "articles" :
                            item.collection === "library" ? "library" : "notes";
    return `/${collectionPrefix}/${item.slug}`;
  };

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
        <h2 className="text-xl font-semibold">미리보기</h2>
        <p className="text-sm text-muted-foreground mt-1">
          포스트를 선택하여 실제 블로그에서 어떻게 보이는지 확인하세요
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
        {/* Left: Content list */}
        <div className="rounded-lg border border-border/60 p-4 space-y-3">
          <h3 className="text-sm font-semibold">컨텐츠 목록</h3>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="검색..."
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />

          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {filtered.map((item) => (
              <button
                key={item.slug}
                onClick={() => setSelectedItem(item)}
                className={`w-full text-left p-2.5 rounded-md transition-colors ${
                  selectedItem?.slug === item.slug
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-muted/50 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-muted text-muted-foreground">
                    {item.collection}
                  </span>
                  <span className="text-sm font-medium truncate">{item.title}</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 ml-12">
                  {item.date}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Preview iframe */}
        <div className="rounded-lg border border-border/60 overflow-hidden">
          {selectedItem ? (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/30">
                <div>
                  <h3 className="text-sm font-semibold">{selectedItem.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedItem.collection} / {selectedItem.slug}
                  </p>
                </div>
                <a
                  href={getPreviewUrl(selectedItem)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  새 탭으로 열기
                </a>
              </div>
              <iframe
                src={getPreviewUrl(selectedItem)}
                className="w-full flex-1 min-h-[700px]"
                title="Preview"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <p className="text-sm text-muted-foreground">컨텐츠를 선택하면</p>
              <p className="text-sm text-muted-foreground">미리보기가 표시됩니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
