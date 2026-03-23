import { NextResponse } from "next/server";
import { getAllPosts, getAllTags, getAllNotes, type Note } from "@/lib/content";
import { siteConfig } from "@/config/site";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const postCount = Math.min(Number(searchParams.get("posts") || 5), 20);
  const tagCount = Math.min(Number(searchParams.get("tags") || 10), 50);
  const noteCount = Math.min(Number(searchParams.get("notes") || 3), 10);

  const posts = getAllPosts("ko").slice(0, postCount).map((post) => ({
    title: post.title,
    link: `${siteConfig.url}/posts/${post.slug.replace(/^posts\//, "")}`,
    date: post.date,
  }));

  const tags = getAllTags("ko").slice(0, tagCount);

  const notes = getAllNotes().slice(0, noteCount).map((note: Note) => ({
    title: note.title,
    link: `${siteConfig.url}/notes`,
    date: note.date,
    tags: note.tags,
  }));

  return NextResponse.json({ posts, tags, notes });
}
