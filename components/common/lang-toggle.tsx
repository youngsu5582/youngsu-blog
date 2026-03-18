"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function LangToggle({ currentLang }: { currentLang: "ko" | "en" }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const switchLang = (lang: "ko" | "en") => {
    // Update localStorage
    localStorage.setItem("locale", lang);
    // Dispatch event for search index
    window.dispatchEvent(new CustomEvent("locale-change", { detail: lang }));
    // Navigate
    if (lang === "en") {
      router.push("/posts?lang=en");
    } else {
      router.push("/posts");
    }
  };

  return (
    <div className="flex gap-1 border border-border rounded-lg p-0.5">
      <button
        onClick={() => switchLang("ko")}
        className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
          currentLang === "ko"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        KO
      </button>
      <button
        onClick={() => switchLang("en")}
        className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
          currentLang === "en"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        EN
      </button>
    </div>
  );
}
