"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import { type Locale, defaultLocale, getLocaleLabel } from "@/lib/i18n";

export function LanguageSwitcher() {
  const [locale, setLocale] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale | null;
    if (saved) setLocale(saved);
  }, []);

  const toggleLocale = () => {
    const next: Locale = locale === "ko" ? "en" : "ko";
    setLocale(next);
    localStorage.setItem("locale", next);
    // 현재는 페이지 새로고침 없이 UI만 변경
    // 나중에 라우팅 기반 i18n으로 확장 시 router.push 사용
    window.dispatchEvent(new CustomEvent("locale-change", { detail: next }));
  };

  return (
    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleLocale}>
      <Languages className="h-4 w-4" />
      <span className="sr-only">{getLocaleLabel(locale)}</span>
    </Button>
  );
}
