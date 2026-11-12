"use client";

import { useState, useMemo } from "react";
import { List, LayoutGrid, Clock, Search, ChevronDown, ChevronRight, ExternalLink, Maximize2 } from "lucide-react";
import { MDXContent } from "@/components/mdx/mdx-content";
import { AnimateIn } from "@/components/common/animate-in";
import Link from "next/link";

interface Reference {
  title: string;
  url: string;
}

interface NoteData {
  slug: string;
  title: string;
  date: string;
  categories: string[];
  tags: string[];
  body: string;
  readingTime: number;
  references?: Reference[];
}

interface TagInfo {
  name: string;
  count: number;
}

function ReferenceLinks({ references }: { references?: Reference[] }) {
  if (!references || references.length === 0) return null;
  return (
    <div className="mt-3 pt-3 border-t border-border/30">
      <p className="text-[11px] text-muted-foreground/60 uppercase tracking-wider mb-1.5">참고</p>
      <div className="flex flex-col gap-1">
        {references.map((ref, i) => (
          <a
            key={i}
            href={ref.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary/70 hover:text-primary transition-colors truncate"
          >
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
            {ref.title}
          </a>
        ))}
      </div>
    </div>
  );
}

type ViewMode = "list" | "card" | "timeline";

// 모바일: 한 줄 가로 스와이프 (본문 좌우 여백 px-6 만큼 화면 끝까지 늘림) / sm 이상: 기존처럼 줄바꿈
const filterRowClass =
  "-mx-6 px-6 py-0.5 flex gap-1.5 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:shrink-0 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible";

export function NotesView({ notes, tags }: { notes: NoteData[]; tags: TagInfo[] }) {
  const [view, setView] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  // 카테고리 집계
  const categoryList = useMemo(() => {
    const map = new Map<string, number>();
    notes.forEach((n) => n.categories.forEach((c) => map.set(c, (map.get(c) || 0) + 1)));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }, [notes]);

  const filtered = useMemo(() => {
    return notes.filter((note) => {
      const matchSearch = !search ||
        note.title.toLowerCase().includes(search.toLowerCase()) ||
        note.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
        note.categories.some((c) => c.toLowerCase().includes(search.toLowerCase()));
      const matchTag = !selectedTag || note.tags.includes(selectedTag);
      const matchCategory = !selectedCategory || note.categories.includes(selectedCategory);
      return matchSearch && matchTag && matchCategory;
    });
  }, [notes, search, selectedTag, selectedCategory]);

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

      {/* Category + Tag filter — 카테고리 줄과 태그 줄을 나눈다 */}
      <div className="space-y-2">
      <div className={filterRowClass}>
        <button
          onClick={() => { setSelectedTag(null); setSelectedCategory(null); }}
          className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${
            !selectedTag && !selectedCategory ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          전체
        </button>
        {categoryList.map(({ name, count }) => (
          <button
            key={`cat-${name}`}
            onClick={() => { setSelectedCategory(selectedCategory === name ? null : name); setSelectedTag(null); }}
            className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${
              selectedCategory === name ? "bg-primary text-white" : "bg-primary/8 text-primary border border-primary/20 hover:bg-primary/15"
            }`}
          >
            {name} <span className="opacity-50">{count}</span>
          </button>
        ))}
      </div>
      <div className={filterRowClass}>
        {tags.map(({ name, count }) => (
          <button
            key={`tag-${name}`}
            onClick={() => { setSelectedTag(selectedTag === name ? null : name); setSelectedCategory(null); }}
            className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${
              selectedTag === name ? "bg-violet-500 text-white" : "bg-violet-500/8 text-violet-600 dark:text-violet-400 border border-violet-500/20 hover:bg-violet-500/15"
            }`}
          >
            #{name} <span className="opacity-50">{count}</span>
          </button>
        ))}
      </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">노트가 없습니다</p>
      ) : view === "list" ? (
        /* Memo list view */
        <div className="space-y-1">
          {filtered.map((note, index) => {
            const isExpanded = expandedSlug === note.slug;
            return (
              <AnimateIn key={note.slug} delay={index * 100}>
                <div className="rounded-lg border border-border/40 overflow-hidden">
                <button
                  onClick={() => setExpandedSlug(isExpanded ? null : note.slug)}
                  className="w-full text-left flex items-start sm:items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 mt-1 sm:mt-0 text-primary flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 mt-1 sm:mt-0 text-muted-foreground flex-shrink-0" />
                  )}
                  {/* 모바일: 제목(첫 줄) → 날짜·분류(둘째 줄) / sm 이상: 날짜 | 제목 | 분류 한 줄 */}
                  <div className="flex-1 min-w-0 flex flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-1">
                  <span className="order-2 sm:order-none text-xs text-muted-foreground font-mono sm:w-20 flex-shrink-0">
                    {new Date(note.date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                  </span>
                  <span className={`order-1 sm:order-none basis-full sm:basis-auto sm:flex-1 min-w-0 text-sm font-medium sm:truncate ${isExpanded ? "text-primary" : ""}`}>
                    {note.title}
                  </span>
                  <div className="order-3 sm:order-none flex flex-wrap sm:flex-nowrap gap-x-1.5 min-w-0 sm:flex-shrink-0">
                    {note.categories.slice(0, 1).map((cat) => (
                      <span key={cat} className="text-[10px] text-primary/60 dark:text-primary/70">{cat}</span>
                    ))}
                    {note.tags.slice(0, 2).map((t) => (
                      <span key={t} className="text-[10px] text-violet-500/70 dark:text-violet-400/70">#{t}</span>
                    ))}
                  </div>
                  </div>
                  {isExpanded && (
                    <Link
                      href={`/notes/${note.slug}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-colors flex-shrink-0"
                    >
                      전체 보기
                      <Maximize2 className="h-3 w-3" />
                    </Link>
                  )}
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 sm:pl-12 prose prose-sm prose-neutral dark:prose-invert max-w-none">
                    <MDXContent code={note.body} />
                    <ReferenceLinks references={note.references} />
                  </div>
                )}
                </div>
              </AnimateIn>
            );
          })}
        </div>
      ) : view === "card" ? (
        /* Card grid view */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((note, index) => {
            const isExpanded = expandedSlug === note.slug;
            return (
            // 그리드 칸은 AnimateIn 이다 — 펼친 카드가 한 줄을 다 쓰도록 col-span 을 여기에 둔다
            <AnimateIn
              key={note.slug}
              delay={index * 100}
              className={`min-w-0 ${isExpanded ? "col-span-full" : ""}`}
            >
              <div
                className={`rounded-lg border transition-all hover:border-primary/30 hover:bg-primary/5 dark:hover:bg-primary/8 ${
                  isExpanded ? "border-primary/30 bg-primary/5" : "border-border/40"
                }`}
              >
              <button
                onClick={() => setExpandedSlug(isExpanded ? null : note.slug)}
                className="w-full text-left p-4"
              >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {note.categories.slice(0, 1).map((cat) => (
                  <span key={cat} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/8 text-primary border border-primary/20">{cat}</span>
                ))}
                {note.tags.slice(0, 2).map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/8 text-violet-600 dark:text-violet-400 border border-violet-500/20">#{t}</span>
                ))}
              </div>
              <h3 className="text-sm font-semibold mb-1">{note.title}</h3>
              <p className="text-[11px] text-muted-foreground">
                {new Date(note.date).toLocaleDateString("ko-KR")} · {note.readingTime}분
              </p>
              </button>
              {/* 본문은 버튼 밖 — 버튼 안에 두면 긴 코드 줄만큼 카드가 늘어나 화면을 밀고, 복사 버튼이 버튼 안에 중첩된다 */}
              {isExpanded && (
                <div className="mx-4 mb-4 pt-3 border-t border-border/30">
                  <Link
                    href={`/notes/${note.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mb-3"
                  >
                    <Maximize2 className="h-3 w-3" />
                    전체 보기
                  </Link>
                  <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
                    <MDXContent code={note.body} />
                  </div>
                </div>
              )}
              </div>
            </AnimateIn>
            );
          })}
        </div>
      ) : (
        /* Timeline view */
        <div className="border-l-2 border-border/50 ml-2 space-y-0">
          {filtered.map((note, index) => {
            const isExpanded = expandedSlug === note.slug;
            return (
              <AnimateIn key={note.slug} delay={index * 100}>
                <div className="relative pl-6 py-3">
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
                  <div className="flex flex-wrap gap-x-1.5 mt-1">
                    {note.categories.slice(0, 1).map((cat) => (
                      <span key={cat} className="text-[10px] text-primary/60 dark:text-primary/70">{cat}</span>
                    ))}
                    {note.tags.map((t) => (
                      <span key={t} className="text-[10px] text-violet-500/70 dark:text-violet-400/70">#{t}</span>
                    ))}
                  </div>
                </button>
                {isExpanded && (
                  <div className="mt-3">
                    <Link
                      href={`/notes/${note.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mb-3"
                    >
                      <Maximize2 className="h-3 w-3" />
                      전체 보기
                    </Link>
                    <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
                      <MDXContent code={note.body} />
                      <ReferenceLinks references={note.references} />
                    </div>
                  </div>
                )}
                </div>
              </AnimateIn>
            );
          })}
        </div>
      )}
    </div>
  );
}
