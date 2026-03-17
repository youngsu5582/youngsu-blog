"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchDialog } from "./search-dialog";
import { buildSearchIndex, type SearchItem } from "@/lib/search";

export function SearchButton() {
  const [open, setOpen] = useState(false);
  const [searchIndex, setSearchIndex] = useState<SearchItem[]>([]);

  // 검색 인덱스 빌드 (클라이언트에서 한 번만)
  useEffect(() => {
    setSearchIndex(buildSearchIndex());
  }, []);

  // ⌘K / Ctrl+K 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        className="relative w-full justify-start text-sm text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 mr-2" />
        <span className="flex-1 text-left">검색...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <SearchDialog
        searchIndex={searchIndex}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
