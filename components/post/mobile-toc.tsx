"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { List, X } from "lucide-react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface MobileTocProps {
  headings: TocItem[];
}

export function MobileToc({ headings }: MobileTocProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-mobile-toc]')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  // Prevent body scroll when dropdown is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleItemClick = (id: string) => {
    setIsOpen(false);
    // Smooth scroll to the heading
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (headings.length === 0) return null;

  return (
    <div className="xl:hidden" data-mobile-toc>
      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-lg transition-all duration-200",
          "bg-primary text-primary-foreground",
          "hover:shadow-xl hover:scale-105 active:scale-95",
          "border border-primary/20"
        )}
        aria-label="Table of Contents"
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <List className="h-5 w-5" />
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Bottom Sheet / Dropdown */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out",
          "bg-background border-t border-primary/20 dark:border-primary/15",
          "rounded-t-2xl shadow-2xl",
          "max-h-[70vh] overflow-y-auto",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-primary/15 dark:border-primary/10 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10 dark:bg-primary/15">
                <List className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm font-bold text-primary tracking-wider">ON THIS PAGE</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-md hover:bg-primary/10 transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-foreground/60" />
            </button>
          </div>
        </div>

        {/* TOC Links */}
        <nav className="px-4 py-4 pb-6">
          <ul className="space-y-1 text-sm">
            {headings.map((heading) => {
              const isActive = activeId === heading.id;
              return (
                <li key={heading.id}>
                  <button
                    onClick={() => handleItemClick(heading.id)}
                    className={cn(
                      "w-full text-left py-2.5 px-3 rounded-lg transition-all duration-200 leading-snug",
                      heading.level === 2
                        ? "pl-3 font-medium"
                        : heading.level === 3
                        ? "pl-6 text-[13px]"
                        : "pl-9 text-xs",
                      isActive
                        ? "text-primary bg-primary/12 dark:bg-primary/15 border-l-[3px] border-primary shadow-sm shadow-primary/5 font-medium"
                        : "text-foreground/70 dark:text-foreground/50 hover:text-primary hover:bg-primary/6 dark:hover:bg-primary/8 border-l-[3px] border-transparent"
                    )}
                  >
                    {heading.text}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
