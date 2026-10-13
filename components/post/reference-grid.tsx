"use client";

import { BookOpen, CheckCircle2, ExternalLink, FileText, ShieldCheck, Video } from "lucide-react";
import {
  getReferenceLayout,
  getYouTubeEmbedUrl,
  type ReferenceInput,
  type ReferenceRole,
  type ReferenceType,
} from "@/lib/references";

interface ReferenceGridProps {
  references?: ReferenceInput[];
}

const typeLabels: Record<ReferenceType, string> = {
  video: "영상",
  article: "아티클",
  docs: "공식 문서",
};

const roleLabels: Record<ReferenceRole, string> = {
  primary: "주요 출처",
  supporting: "보조 출처",
  verification: "검증 자료",
};

function TypeIcon({ type }: { type: ReferenceType }) {
  if (type === "video") return <Video className="h-4 w-4" aria-hidden="true" />;
  if (type === "docs") return <ShieldCheck className="h-4 w-4" aria-hidden="true" />;
  return <BookOpen className="h-4 w-4" aria-hidden="true" />;
}

function roleLabel(role: ReferenceRole | undefined, featured: boolean) {
  if (role) return roleLabels[role];
  return featured ? roleLabels.primary : roleLabels.supporting;
}

function ReferenceCard({
  reference,
  featured,
}: {
  reference: ReturnType<typeof getReferenceLayout>["secondary"][number];
  featured?: boolean;
}) {
  const embedUrl = reference.type === "video" ? getYouTubeEmbedUrl(reference.url) : null;
  const isEmbeddableVideo = Boolean(embedUrl);

  return (
    <article
      className={`overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-shadow hover:shadow-md ${featured ? "md:col-span-2" : ""}`}
    >
      {isEmbeddableVideo ? (
        <iframe
          className="aspect-video w-full border-0 bg-black"
          src={embedUrl ?? undefined}
          title={reference.title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : null}

      <div className="p-4 sm:p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1">
            <TypeIcon type={reference.type} />
            {typeLabels[reference.type]}
          </span>
          <span className="text-primary">{roleLabel(reference.role, Boolean(featured))}</span>
        </div>
        <h3 className="text-base font-semibold leading-snug tracking-tight sm:text-lg">
          {reference.title}
        </h3>
        {reference.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {reference.description}
          </p>
        )}
        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="truncate">{reference.hostname}</span>
          <a
            className="inline-flex shrink-0 items-center gap-1 font-semibold text-primary hover:underline"
            href={reference.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            원문 열기
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
}

export function ReferenceGrid({ references = [] }: ReferenceGridProps) {
  const layout = getReferenceLayout(references);
  if (!layout.primary && layout.secondary.length === 0) return null;

  return (
    <section
      className="my-8 rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5"
      aria-labelledby="article-references-title"
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-primary">
            Source map
          </p>
          <h2
            id="article-references-title"
            className="mt-1 flex items-center gap-2 text-xl font-semibold tracking-tight"
          >
            <FileText className="h-5 w-5 text-primary" aria-hidden="true" />이 글의 참고자료
          </h2>
        </div>
        <span className="text-xs text-muted-foreground">
          {layout.primary ? "대표 영상 1" : "참고자료"} · {layout.secondary.length}개 추가 자료
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {layout.primary && <ReferenceCard reference={layout.primary} featured />}
        {layout.secondary.map((reference) => (
          <ReferenceCard key={reference.url} reference={reference} />
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs leading-relaxed text-muted-foreground">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
        대표 영상은 위에 크게 표시되고, 나머지 자료는 추가되는 순서대로 자동 배치됩니다.
      </div>
    </section>
  );
}
