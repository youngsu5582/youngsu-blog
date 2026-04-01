import { notFound } from "next/navigation";
import { getAllNotes, getNoteBySlug, getUrlSlug, type Note } from "@/lib/content";
import { MDXContent } from "@/components/mdx/mdx-content";
import { ScrollToTop } from "@/components/common/scroll-to-top";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Calendar, ExternalLink } from "lucide-react";

interface NotePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const notes = getAllNotes();
  return notes.map((note: Note) => ({
    slug: getUrlSlug(note.slug),
  }));
}

export async function generateMetadata({ params }: NotePageProps): Promise<Metadata> {
  const { slug } = await params;
  const note = getNoteBySlug(slug);

  if (!note) {
    return { title: "노트를 찾을 수 없습니다" };
  }

  return {
    title: note.title || slug,
    description: `학습 노트: ${note.title || slug}`,
  };
}

export default async function NotePage({ params }: NotePageProps) {
  const { slug } = await params;
  const note = getNoteBySlug(slug);

  if (!note) {
    notFound();
  }

  const title = note.title || slug;
  const references = (note as any).references || [];

  return (
    <>
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
