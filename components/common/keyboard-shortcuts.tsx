"use client";

import { useEffect } from "react";

interface KeyboardShortcutsProps {
  onSearchOpen: () => void;
}

export function KeyboardShortcuts({ onSearchOpen }: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // "/" 키로 검색 다이얼로그 열기
      if (e.key === "/") {
        // input, textarea, contenteditable 요소에서는 비활성화
        const target = e.target as HTMLElement;
        const isEditableElement =
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable;

        if (!isEditableElement) {
          e.preventDefault();
          onSearchOpen();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSearchOpen]);

  return null;
}
