import Link from "next/link";
import { Languages } from "lucide-react";

interface TranslationBadgeProps {
  lang?: "ko" | "en";
  slug?: string;
  size?: "sm" | "md";
}

export function TranslationBadge({ lang, slug, size = "sm" }: TranslationBadgeProps) {
  if (!lang || !slug) {
    return null;
  }

  const isEnglish = lang === "en";
  const label = isEnglish ? "English version available" : "한국어 버전 있음";
  const text = isEnglish ? "EN" : "KO";
  const sizeClass = size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[11px]";
  const iconClass = size === "md" ? "h-3.5 w-3.5" : "h-3 w-3";

  return (
    <Link
      href={`/posts/${slug}`}
      aria-label={label}
      title={label}
      className={`inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 ${sizeClass} font-semibold tracking-wide text-primary shadow-[0_0_18px_rgba(34,211,238,0.08)] transition-all hover:border-primary/50 hover:bg-primary/15 hover:text-primary`}
    >
      <Languages className={iconClass} aria-hidden="true" />
      <span>{text}</span>
    </Link>
  );
}
