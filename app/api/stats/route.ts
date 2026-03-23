import { NextResponse } from "next/server";
import { getAllPosts, getAllTags } from "@/lib/content";
import { siteConfig } from "@/config/site";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const postCount = Math.min(Number(searchParams.get("posts") || 5), 20);
  const tagCount = Math.min(Number(searchParams.get("tags") || 10), 50);

  const posts = getAllPosts("ko").slice(0, postCount).map((post) => ({
    title: post.title,
    link: `${siteConfig.url}/posts/${post.slug.replace(/^posts\//, "")}`,
    date: post.date,
  }));

  const tags = getAllTags("ko").slice(0, tagCount);

  return NextResponse.json({ posts, tags });
}
