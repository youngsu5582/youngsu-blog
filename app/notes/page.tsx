import { getAllNotes, getAllNoteTags, getUrlSlug, type Note } from "@/lib/content";
import { NotesView } from "@/components/notes/notes-view";

export const metadata = {
  title: "학습 노트",
  description: "간단한 학습 기록과 메모",
};

export default function NotesPage() {
  const notes = getAllNotes();
  const tags = getAllNoteTags();

  const serialized = notes.map((note: Note) => ({
    slug: getUrlSlug(note.slug),
    title: note.title || getUrlSlug(note.slug),
    date: note.date,
    tags: note.tags,
    body: note.body,
    readingTime: note.metadata.readingTime,
    references: (note as any).references || [],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight theme-heading">학습 노트</h1>
        <p className="text-muted-foreground mt-3 text-sm">
          {notes.length}개의 메모 · 부담 없이 기록하는 학습 조각들
        </p>
      </div>

      <NotesView notes={serialized} tags={tags} />
    </div>
  );
}
