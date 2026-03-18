import { NextResponse } from "next/server";
import { getAllCategories, getAllTags } from "@/lib/content";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

export async function GET() {
  const cwd = process.cwd();
  const contentDir = path.join(cwd, "content");

  // Find new/modified content files from git status
  let changedFiles: Array<{ path: string; status: string }> = [];
  try {
    const gitStatus = execSync("git status --porcelain content/", { cwd, encoding: "utf-8" });
    changedFiles = gitStatus
      .split("\n")
      .filter(Boolean)
      .map((line) => ({
        status: line.substring(0, 2).trim(),
        path: line.substring(3).trim(),
      }))
      .filter((f) => f.path.endsWith(".mdx") || f.path.endsWith(".md"));
  } catch {}

  // Parse each file's frontmatter
  const posts = changedFiles.map((file) => {
    const absPath = path.join(cwd, file.path);
    let frontmatter: Record<string, unknown> = {};
    try {
      const raw = fs.readFileSync(absPath, "utf-8");
      frontmatter = matter(raw).data;
    } catch {}

    // Detect collection from path
    let collection = "posts";
    if (file.path.includes("content/articles")) collection = "articles";
    else if (file.path.includes("content/library")) collection = "library";

    const filename = path.basename(file.path, path.extname(file.path));
    const isEn = filename.endsWith("-en");

    return {
      filePath: file.path,
      filename,
      gitStatus: file.status === "??" ? "new" : "modified",
      collection,
      isEn,
      title: (frontmatter.title as string) || filename,
      description: (frontmatter.description as string) || "",
      categories: (frontmatter.categories as string[]) || [],
      tags: (frontmatter.tags as string[]) || [],
      image: (frontmatter.image as string) || undefined,
      date: (frontmatter.date as string) || new Date().toISOString().split("T")[0],
      draft: frontmatter.draft !== false, // new files are draft by default
    };
  });

  // Only show Korean (non -en) posts, group en as linked
  const koPosts = posts.filter((p) => !p.isEn);
  const enPosts = posts.filter((p) => p.isEn);

  const result = koPosts.map((post) => {
    const baseSlug = post.filename;
    const enVersion = enPosts.find((ep) => ep.filename === `${baseSlug}-en`);
    return {
      ...post,
      hasEnVersion: !!enVersion,
      enFilePath: enVersion?.filePath,
    };
  });

  const categories = getAllCategories().map((c) => c.name);
  const tags = getAllTags().map((t) => t.name);

  return NextResponse.json({ posts: result, categories, tags });
}
