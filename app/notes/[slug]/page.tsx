import { notFound } from "next/navigation";
import { getAllNotes, getNoteBySlug, getUrlSlug, type Note } from "@/lib/content";
import { MDXContent } from "@/components/mdx/mdx-content";
import { ScrollToTop } from "@/components/common/scroll-to-top";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { generateArticleSchema, generateBreadcrumbSchema, renderJsonLd } from "@/lib/json-ld";
import { siteConfig } from "@/config/site";
import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, ExternalLink } from "lucide-react";

interface NotePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const notes = getAllNotes();
  return notes.map((note: Note) => ({
    slug: getUrlSlug(note.slug),
  }));
}

function noteDescription(note: Note, fallbackTitle: string) {
  return note.description || `학습 노트: ${fallbackTitle}`;
}

function calcWordCount(rawContent: string): number {
  return rawContent
    .replace(/^---[\s\S]*?---/, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/<[^>]+>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export async function generateMetadata({ params }: NotePageProps): Promise<Metadata> {
  const { slug } = await params;
  const note = getNoteBySlug(slug);

  if (!note) {
    return { title: "노트를 찾을 수 없습니다" };
  }

  const title = note.title || slug;
  const description = noteDescription(note, title);
  const url = `${siteConfig.url}/notes/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: `/notes/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: note.date,
      authors: [siteConfig.author.name],
      url,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function NotePage({ params }: NotePageProps) {
  const { slug } = await params;
  const note = getNoteBySlug(slug);

  if (!note) {
    notFound();
  }

  const title = note.title || slug;
  const description = noteDescription(note, title);
  const references = note.references || [];
  const noteUrl = `${siteConfig.url}/notes/${slug}`;
  const articleSchema = generateArticleSchema({
    title,
    description,
    datePublished: note.date,
    author: siteConfig.author.name,
    url: noteUrl,
    inLanguage: "ko",
    keywords: note.tags,
    articleSection: note.categories,
    wordCount: calcWordCount(note.body),
    timeRequired: `PT${Math.max(1, note.metadata.readingTime)}M`,
  });
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "홈", url: siteConfig.url },
    { name: "학습 노트", url: `${siteConfig.url}/notes` },
    { name: title, url: noteUrl },
  ]);

  return (
    <>
      {renderJsonLd(articleSchema)}
      {renderJsonLd(breadcrumbSchema)}
      <article className="max-w-2xl mx-auto">
        <Breadcrumbs
          items={[
            { label: "학습 노트", href: "/notes" },
            { label: title, href: `/notes/${slug}`, current: true },
          ]}
        />

        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(note.date).toLocaleDateString("ko-KR")}
            </span>
            {note.tags.length > 0 && (
              <div className="flex gap-1.5">
                {note.tags.map((tag: string) => (
                  <Link
                    key={tag}
                    href={`/tags/${tag}`}
                    className="text-xs px-2 py-0.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </header>

        <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-p:leading-relaxed prose-pre:max-w-full prose-pre:overflow-x-auto">
          <MDXContent code={note.body} />
        </div>

        {references.length > 0 && (
          <div className="mt-10 pt-6 border-t border-border/60">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">참고 자료</h2>
            <ul className="space-y-1.5">
              {references.map((ref: { title: string; url: string }, i: number) => (
                <li key={i}>
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    {ref.title}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>
      <ScrollToTop />
    </>
  );
}
