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

interface SearchDialogProps {
  searchIndex: SearchItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ searchIndex, open, onOpenChange }: SearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Fuse.js 인스턴스 생성
  const fuse = useMemo(() => {
    return new Fuse(searchIndex, {
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
  }, [searchIndex]);

  // 검색 결과 계산
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const fuseResults = fuse.search(query);
    return fuseResults.slice(0, searchConfig.maxResults).map((result) => result.item);
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

  // 검색 결과 초기화
  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  // 선택된 항목이 범위를 벗어나면 조정
  useEffect(() => {
    if (selectedIndex >= results.length && results.length > 0) {
      setSelectedIndex(0);
    }
  }, [results.length, selectedIndex]);

  const handleSelect = (item: SearchItem) => {
    const basePath = item.type === "article" ? "/articles" : item.type === "library" ? "/library" : "/posts";
    router.push(`${basePath}/${item.slug}`);
    onOpenChange(false);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-900/50 text-foreground">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0 gap-0" showCloseButton={false}>
        <DialogHeader className="p-4 pb-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="검색어를 입력하세요..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              autoFocus
            />
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[60vh] p-2">
          {query.trim() === "" ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Search className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-sm">검색어를 입력하면 포스트를 찾을 수 있습니다</p>
              <p className="text-xs mt-2">↑↓ 키로 이동, Enter로 선택</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Search className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-sm">검색 결과가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((item, index) => (
                <button
                  key={item.slug}
                  onClick={() => handleSelect(item)}
                  className={`w-full text-left p-3 rounded-md transition-colors ${
                    index === selectedIndex
                      ? "bg-muted"
                      : "hover:bg-muted/50"
                  }`}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="font-medium text-sm mb-1">
                    {highlightMatch(item.title, query)}
                  </div>
                  {item.description && (
                    <div className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {highlightMatch(item.description, query)}
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.categories.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Folder className="h-3 w-3" />
                        <span>{item.categories[0]}</span>
                      </div>
                    )}
                    {item.tags.slice(0, 3).map((tag) => (
                      <div
                        key={tag}
                        className="flex items-center gap-1 text-xs text-muted-foreground"
                      >
                        <Hash className="h-3 w-3" />
                        <span>{tag}</span>
                      </div>
                    ))}
                  </div>
                </button>
              ))}
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
