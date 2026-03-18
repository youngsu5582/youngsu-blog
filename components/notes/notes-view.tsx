"use client";

import { useState, useMemo } from "react";
import { List, LayoutGrid, Clock, Search, ChevronDown, ChevronRight } from "lucide-react";
import { MDXContent } from "@/components/mdx/mdx-content";

interface NoteData {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  body: string;
  readingTime: number;
}

interface TagInfo {
  name: string;
  count: number;
}

type ViewMode = "list" | "card" | "timeline";

export function NotesView({ notes, tags }: { notes: NoteData[]; tags: TagInfo[] }) {
  const [view, setView] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return notes.filter((note) => {
      const matchSearch = !search ||
        note.title.toLowerCase().includes(search.toLowerCase()) ||
        note.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchTag = !selectedTag || note.tags.includes(selectedTag);
      return matchSearch && matchTag;
    });
  }, [notes, search, selectedTag]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="검색..."
            className="w-full pl-8 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* View toggle */}
        <div className="flex gap-1 border border-border rounded-lg p-0.5">
          {([
            { mode: "list" as const, icon: List, label: "리스트" },
            { mode: "card" as const, icon: LayoutGrid, label: "카드" },
            { mode: "timeline" as const, icon: Clock, label: "타임라인" },
          ]).map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setView(mode)}
              className={`p-1.5 rounded-md transition-colors ${
                view === mode
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title={label}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Tag filter */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setSelectedTag(null)}
          className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${
            !selectedTag ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          전체
        </button>
        {tags.map(({ name, count }) => (
          <button
            key={name}
            onClick={() => setSelectedTag(selectedTag === name ? null : name)}
            className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${
              selectedTag === name ? "bg-primary text-primary-foreground" : "theme-tag"
            }`}
          >
            #{name} <span className="opacity-50">{count}</span>
          </button>
        ))}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">노트가 없습니다</p>
      ) : view === "list" ? (
        /* Memo list view */
        <div className="space-y-1">
          {filtered.map((note) => {
            const isExpanded = expandedSlug === note.slug;
            return (
              <div key={note.slug} className="rounded-lg border border-border/40 overflow-hidden">
                <button
                  onClick={() => setExpandedSlug(isExpanded ? null : note.slug)}
                  className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className="text-xs text-muted-foreground font-mono w-20 flex-shrink-0">
                    {new Date(note.date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                  </span>
                  <span className={`text-sm font-medium flex-1 truncate ${isExpanded ? "text-primary" : ""}`}>
                    {note.title}
                  </span>
                  <div className="flex gap-1 flex-shrink-0">
                    {note.tags.slice(0, 2).map((t) => (
                      <span key={t} className="text-[10px] text-muted-foreground/60">#{t}</span>
                    ))}
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 pl-12 prose prose-sm prose-neutral dark:prose-invert max-w-none">
                    <MDXContent code={note.body} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : view === "card" ? (
        /* Card grid view */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((note) => (
            <button
              key={note.slug}
              onClick={() => setExpandedSlug(expandedSlug === note.slug ? null : note.slug)}
              className={`text-left rounded-lg border p-4 transition-all hover:border-primary/30 hover:bg-primary/5 dark:hover:bg-primary/8 ${
                expandedSlug === note.slug ? "border-primary/30 bg-primary/5 col-span-full" : "border-border/40"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {note.tags.slice(0, 2).map((t) => (
                  <span key={t} className="theme-tag text-[10px] px-2 py-0.5 rounded-full">#{t}</span>
                ))}
              </div>
              <h3 className="text-sm font-semibold mb-1">{note.title}</h3>
              <p className="text-[11px] text-muted-foreground">
                {new Date(note.date).toLocaleDateString("ko-KR")} · {note.readingTime}분
              </p>
              {expandedSlug === note.slug && (
                <div className="mt-3 pt-3 border-t border-border/30 prose prose-sm prose-neutral dark:prose-invert max-w-none">
                  <MDXContent code={note.body} />
                </div>
              )}
            </button>
          ))}
        </div>
      ) : (
        /* Timeline view */
        <div className="border-l-2 border-border/50 ml-2 space-y-0">
          {filtered.map((note) => {
            const isExpanded = expandedSlug === note.slug;
            return (
              <div key={note.slug} className="relative pl-6 py-3">
                <div className="absolute -left-[5px] top-4 h-2 w-2 rounded-full bg-primary/60" />
                <button
                  onClick={() => setExpandedSlug(isExpanded ? null : note.slug)}
                  className="w-full text-left"
                >
                  <p className="text-[11px] text-muted-foreground font-mono">
                    {new Date(note.date).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                  <p className={`text-sm font-medium mt-0.5 ${isExpanded ? "text-primary" : "hover:text-primary transition-colors"}`}>
                    {note.title}
                  </p>
                  <div className="flex gap-1.5 mt-1">
                    {note.tags.map((t) => (
                      <span key={t} className="text-[10px] text-muted-foreground/60">#{t}</span>
                    ))}
                  </div>
                </button>
                {isExpanded && (
                  <div className="mt-3 prose prose-sm prose-neutral dark:prose-invert max-w-none">
                    <MDXContent code={note.body} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
