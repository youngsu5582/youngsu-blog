"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface BrowserLanguageHintProps {
  currentLang: "ko" | "en";
}

export function BrowserLanguageHint({ currentLang }: BrowserLanguageHintProps) {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (currentLang !== "ko") return;
    if (localStorage.getItem("dismissed-en-posts-hint") === "true") return;

    const preferredLanguage = navigator.language || navigator.languages?.[0] || "";
    queueMicrotask(() => setShowHint(preferredLanguage.toLowerCase().startsWith("en")));
  }, [currentLang]);

  if (!showHint) return null;

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>
          English posts are available. 브라우저 언어가 영어라면 영어 글 목록도 볼 수 있어요.
        </span>
        <div className="flex gap-2">
          <Link href="/posts?lang=en" className="font-medium text-primary hover:underline">
            View English posts
          </Link>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => {
              localStorage.setItem("dismissed-en-posts-hint", "true");
              setShowHint(false);
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
