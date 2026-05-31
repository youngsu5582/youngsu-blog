"use client";

import { useState, useEffect, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import { type Locale, defaultLocale, getLocaleLabel } from "@/lib/i18n";

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale | null;
    if (saved === "ko" || saved === "en") {
      queueMicrotask(() => setLocale(saved));
    }
  }, []);

  const toggleLocale = () => {
    const next: Locale = locale === "ko" ? "en" : "ko";
    const currentSearch = window.location.search;
    const currentPath = `${pathname}${currentSearch}`;

    setLocale(next);
    localStorage.setItem("locale", next);
    window.dispatchEvent(new CustomEvent("locale-change", { detail: next }));

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/i18n/switch-target?path=${encodeURIComponent(currentPath)}&lang=${next}`,
        );
        const data = (await response.json()) as { href?: string };
        router.push(data.href || (next === "en" ? "/posts?lang=en" : "/"));
      } catch {
        router.push(next === "en" ? "/posts?lang=en" : "/");
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={toggleLocale}
      disabled={isPending}
      title={locale === "ko" ? "Switch to English" : "한국어로 전환"}
    >
      <Languages className="h-4 w-4" />
      <span className="sr-only">{getLocaleLabel(locale)}</span>
    </Button>
  );
}
