"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface LangToggleProps {
  currentLang: "ko" | "en";
  basePath?: string; // default: "/posts"
}

function getLangHref(basePath: string, lang: "ko" | "en") {
  return lang === "en" ? `${basePath}?lang=en` : basePath;
}

function LoadingDot() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin"
    />
  );
}

export function LangToggle({ currentLang, basePath = "/posts" }: LangToggleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingLang, setPendingLang] = useState<"ko" | "en" | null>(null);

  useEffect(() => {
    router.prefetch(getLangHref(basePath, currentLang === "ko" ? "en" : "ko"));
  }, [basePath, currentLang, router]);

  useEffect(() => {
    setPendingLang(null);
  }, [currentLang]);

  const switchLang = (lang: "ko" | "en") => {
    if (lang === currentLang || isPending) {
      return;
    }

    const href = getLangHref(basePath, lang);
    setPendingLang(lang);
    localStorage.setItem("locale", lang);
    window.dispatchEvent(new CustomEvent("locale-change", { detail: lang }));

    startTransition(() => {
      router.push(href);
    });
  };

  const loadingLabel = pendingLang === "en" ? "Switching to English..." : "한국어로 전환 중...";

  return (
    <div className="flex flex-col items-end gap-1">
      <div
        className="flex gap-1 border border-border rounded-lg p-0.5 bg-background/70 backdrop-blur-sm"
        aria-busy={isPending}
      >
        {(["ko", "en"] as const).map((lang) => {
          const isActive = currentLang === lang;
          const isLoading = isPending && pendingLang === lang;
          return (
            <button
              key={lang}
              type="button"
              onClick={() => switchLang(lang)}
              disabled={isPending}
              className={`inline-flex min-w-10 items-center justify-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
              } ${isPending ? "cursor-wait opacity-80" : ""}`}
              aria-current={isActive ? "true" : undefined}
            >
              {isLoading && <LoadingDot />}
              {lang.toUpperCase()}
            </button>
          );
        })}
      </div>
      {isPending && pendingLang && (
        <p className="text-[11px] text-muted-foreground animate-pulse" role="status" aria-live="polite">
          {loadingLabel}
        </p>
      )}
    </div>
  );
}
