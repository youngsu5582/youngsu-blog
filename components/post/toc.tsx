"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { List } from "lucide-react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TocProps {
  headings: TocItem[];
}

export function TableOfContents({ headings }: TocProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0px 0px -80% 0px" }
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="hidden xl:block">
      <div className="sticky top-20 rounded-xl border border-primary/20 dark:border-primary/15 bg-gradient-to-b from-primary/5 to-transparent dark:from-primary/8 dark:to-transparent p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-primary/15 dark:border-primary/10">
          <div className="p-1 rounded-md bg-primary/10 dark:bg-primary/15">
            <List className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-xs font-bold text-primary tracking-wider">ON THIS PAGE</p>
        </div>

        {/* Links */}
        <ul className="space-y-0.5 text-[13px]">
          {headings.map((heading) => {
            const isActive = activeId === heading.id;
            return (
              <li key={heading.id}>
                <a
                  href={`#${heading.id}`}
                  className={cn(
                    "block py-1.5 rounded-md px-2.5 transition-all duration-200 leading-snug",
                    heading.level === 2
                      ? "pl-2.5 font-medium"
                      : heading.level === 3
                      ? "pl-5"
                      : "pl-8 text-[12px]",
                    isActive
                      ? "text-primary bg-primary/12 dark:bg-primary/15 border-l-[3px] border-primary shadow-sm shadow-primary/5"
                      : "text-foreground/50 dark:text-foreground/40 hover:text-primary hover:bg-primary/6 dark:hover:bg-primary/8 border-l-[3px] border-transparent"
                  )}
                >
                  {heading.text}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
