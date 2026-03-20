"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { searchConfig } from "@/config/search";
import type { SearchItem } from "@/lib/search";
import { Search, Hash, Folder } from "lucide-react";
import { trackSearch } from "@/lib/analytics";

interface SearchDialogProps {
  searchIndex: SearchItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getCurrentLang(): "ko" | "en" {
  if (typeof window === "undefined") return "ko";
  const params = new URLSearchParams(window.location.search);
  if (params.get("lang") === "en") return "en";
  return (localStorage.getItem("locale") as "ko" | "en") || "ko";
}

const TYPE_BADGE: Record<string, { label: string; className: string }> = {
  post: { label: "포스트", className: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400" },
  article: { label: "아티클", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  library: { label: "서재", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  note: { label: "노트", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
};

export function SearchDialog({ searchIndex, open, onOpenChange }: SearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredIndex = useMemo(() => {
    const lang = getCurrentLang();
    return searchIndex.filter((item) => !item.lang || item.lang === lang);
  }, [searchIndex, open]);

  const fuse = useMemo(() => {
    return new Fuse(filteredIndex, {
      keys: [
        { name: "title", weight: searchConfig.weights.title },
        { name: "description", weight: searchConfig.weights.description },
        { name: "tags", weight: searchConfig.weights.tags },
        { name: "categories", weight: searchConfig.weights.categories },
      ],
      threshold: searchConfig.threshold,
      minMatchCharLength: searchConfig.minMatchCharLength,
      includeMatches: true,
      ignoreLocation: true,
    });
  }, [filteredIndex]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const items = fuse.search(query).slice(0, searchConfig.maxResults).map((r) => r.item);
    if (items.length > 0) trackSearch(query, items.length);
    return items;
  }, [query, fuse]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  useEffect(() => {
    if (!open) { setQuery(""); setSelectedIndex(0); }
  }, [open]);

  useEffect(() => {
    if (selectedIndex >= results.length && results.length > 0) setSelectedIndex(0);
  }, [results.length, selectedIndex]);

  const handleSelect = (item: SearchItem) => {
    const basePath =
      item.type === "article" ? "/articles" :
      item.type === "library" ? "/library" :
      item.type === "note" ? "/notes" :
      "/posts";

    if (item.type === "note") {
      router.push("/notes");
    } else {
      router.push(`${basePath}/${item.slug}`);
    }
    onOpenChange(false);
  };

  const highlightMatch = (text: string, q: string) => {
    if (!q.trim()) return text;
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/50 text-foreground rounded-sm px-0.5">{part}</mark>
      ) : part
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 gap-0" showCloseButton={false}>
        <DialogHeader className="p-4 pb-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="포스트, 아티클, 노트 검색..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              aria-label="검색"
              autoFocus
            />
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[65vh] p-2">
          {query.trim() === "" ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Search className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-sm">검색어를 입력하면 콘텐츠를 찾을 수 있습니다</p>
              <p className="text-xs mt-2">↑↓ 이동 · Enter 선택 · ESC 닫기</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Search className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-sm">검색 결과가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((item, index) => {
                const badge = TYPE_BADGE[item.type];
                return (
                  <button
                    key={`${item.type}-${item.slug}`}
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left p-3 rounded-md transition-colors ${
                      index === selectedIndex ? "bg-muted" : "hover:bg-muted/50"
                    }`}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                      <span className="font-medium text-sm">{highlightMatch(item.title, query)}</span>
                    </div>
                    {item.description && (
                      <div className="text-xs text-muted-foreground line-clamp-2 mb-2 ml-[calc(1.5rem+0.5rem)]">
                        {highlightMatch(item.description, query)}
                      </div>
                    )}
                    <div className="flex items-center gap-2 flex-wrap ml-[calc(1.5rem+0.5rem)]">
                      {item.categories.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Folder className="h-3 w-3" />
                          <span>{item.categories[0]}</span>
                        </div>
                      )}
                      {item.tags.slice(0, 3).map((tag) => (
                        <div key={tag} className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Hash className="h-3 w-3" />
                          <span>{tag}</span>
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t p-3 text-xs text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>↑↓ 이동</span>
            <span>Enter 선택</span>
            <span>ESC 닫기</span>
          </div>
          <div>{results.length > 0 && `${results.length}개 결과`}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
