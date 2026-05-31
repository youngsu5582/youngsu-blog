import Link from "next/link";
import { Languages } from "lucide-react";

interface TranslationNoticeProps {
  currentLang: "ko" | "en";
  alternate: {
    title: string;
    slug: string;
    lang: "ko" | "en";
  };
}

export function TranslationNotice({ currentLang, alternate }: TranslationNoticeProps) {
  const isEnglishCurrent = currentLang === "en";

  return (
    <aside className="my-6 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Languages className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {isEnglishCurrent ? "한국어 원문이 있습니다" : "English version available"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isEnglishCurrent
                ? "이 글은 한국어 원문으로도 읽을 수 있어요."
                : "This post is also available in English."}
            </p>
          </div>
        </div>
        <Link
          href={`/posts/${alternate.slug}`}
          className="inline-flex flex-shrink-0 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {alternate.lang === "ko" ? "한국어로 읽기" : "Read in English"}
        </Link>
      </div>
    </aside>
  );
}
