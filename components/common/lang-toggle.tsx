"use client";

import { useRouter } from "next/navigation";

interface LangToggleProps {
  currentLang: "ko" | "en";
  basePath?: string; // default: "/posts"
}

export function LangToggle({ currentLang, basePath = "/posts" }: LangToggleProps) {
  const router = useRouter();

  const switchLang = (lang: "ko" | "en") => {
    localStorage.setItem("locale", lang);
    window.dispatchEvent(new CustomEvent("locale-change", { detail: lang }));

    if (lang === "en") {
      router.push(`${basePath}?lang=en`);
    } else {
      router.push(basePath);
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
