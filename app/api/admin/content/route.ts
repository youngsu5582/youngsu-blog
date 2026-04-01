import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { execSync } from "child_process";

const CONTENT_DIR = path.join(process.cwd(), "content");

// GET: 파일의 frontmatter 읽기 또는 전체 컨텐츠 목록
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get("file");

  // Special: return all existing categories and tags
  if (filePath === "_taxonomies") {
    const { getAllCategories, getAllTags } = require("@/lib/content");
    const categories = getAllCategories().map((c: { name: string }) => c.name);
    const tags = getAllTags().map((t: { name: string }) => t.name);
    return NextResponse.json({ categories, tags });
  }

  // Special: return all posts with metadata for bulk-edit
  if (filePath === "_posts") {
    try {
      const postsDir = path.join(CONTENT_DIR, "posts");
      let files: string[] = [];
      try {
        files = fs.readdirSync(postsDir).filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));
      } catch {}

      const posts = files.map((filename) => {
        const absPath = path.join(postsDir, filename);
        const relPath = `content/posts/${filename}`;
        let frontmatter: Record<string, unknown> = {};
        try {
          const raw = fs.readFileSync(absPath, "utf-8");
          frontmatter = matter(raw).data;
        } catch {}

        return {
          filePath: relPath,
          filename: filename.replace(/\.mdx?$/, ""),
          title: (frontmatter.title as string) || filename,
          categories: (frontmatter.categories as string[]) || [],
          tags: (frontmatter.tags as string[]) || [],
        };
      });

      const { getAllCategories, getAllTags } = require("@/lib/content");
      const categories = getAllCategories().map((c: { name: string }) => c.name);
      const tags = getAllTags().map((t: { name: string }) => t.name);

      return NextResponse.json({ posts, categories, tags });
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  // Special: return all content items for preview
  if (!filePath) {
    try {
      const {
        getAllPosts,
        getAllArticles,
        getAllNotes,
        getAllLibraryItems,
        getUrlSlug,
      } = require("@/lib/content");

      const posts = getAllPosts().map((p: any) => ({
        slug: getUrlSlug(p.slug),
        title: p.title,
        collection: "posts",
        date: p.date,
      }));

      const articles = getAllArticles().map((a: any) => ({
        slug: getUrlSlug(a.slug),
        title: a.title,
        collection: "articles",
        date: a.date,
      }));

      const notes = getAllNotes().map((n: any) => ({
        slug: getUrlSlug(n.slug),
        title: n.title,
        collection: "notes",
        date: n.date,
      }));

      const library = getAllLibraryItems().map((l: any) => ({
        slug: getUrlSlug(l.slug),
        title: l.title,
        collection: "library",
        date: l.date,
      }));

      let items = [...posts, ...articles, ...notes, ...library];

      // Supplement with uncommitted content files from git status
      try {
        const gitStatus = execSync(
          'git -c core.quotePath=false status --porcelain content/',
          { encoding: 'utf-8', cwd: process.cwd() }
        );

        const uncommittedFiles = gitStatus
          .split('\n')
          .filter(line => line.trim())
          .map(line => {
            // Git status format: XY filename
            // We care about new (??), modified (M), added (A) files
            const match = line.match(/^(?:\?\?|[AM ][M ])\s+(.+)$/);
            return match ? match[1] : null;
          })
          .filter((file): file is string =>
            file !== null &&
            file.startsWith('content/') &&
            (file.endsWith('.mdx') || file.endsWith('.md'))
          );

        for (const filePath of uncommittedFiles) {
          // Extract collection from path: content/{collection}/{filename}
          const pathParts = filePath.split('/');
          if (pathParts.length < 3) continue;

          const collection = pathParts[1]; // posts, articles, notes, library
          const filename = pathParts[pathParts.length - 1];
          const slug = filename.replace(/\.mdx?$/, '');

          // Check if already in Velite results
          const alreadyExists = items.some(item =>
            item.collection === collection && item.slug.endsWith(slug)
          );

          if (!alreadyExists) {
            // Read frontmatter from filesystem
            try {
              const absPath = path.join(process.cwd(), filePath);
              const raw = fs.readFileSync(absPath, 'utf-8');
              const { data } = matter(raw);

              items.push({
                slug,
                title: (data.title as string) || slug,
                collection,
                date: (data.date as string) || new Date().toISOString(),
                source: 'filesystem', // Mark as not yet built by Velite
              });
            } catch (err) {
              console.error(`Failed to read ${filePath}:`, err);
            }
          }
        }
      } catch (gitErr) {
        // If git command fails, just continue with Velite data only
        console.error('Git status check failed:', gitErr);
      }

      return NextResponse.json({ items });
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  const absPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(absPath)) {
    return NextResponse.json({ error: "file not found" }, { status: 404 });
  }

  try {
    const raw = fs.readFileSync(absPath, "utf-8");
    const { data } = matter(raw);
    return NextResponse.json({ frontmatter: data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST: frontmatter 업데이트
export async function POST(req: Request) {
  try {
    const { file, frontmatter } = await req.json();
    const absPath = path.join(process.cwd(), file);

    if (!fs.existsSync(absPath)) {
      return NextResponse.json({ error: "file not found" }, { status: 404 });
    }

    const raw = fs.readFileSync(absPath, "utf-8");
    const { content } = matter(raw);

    // Rebuild frontmatter
    const lines = ["---"];
    for (const [key, val] of Object.entries(frontmatter)) {
      if (val === undefined || val === null) continue;
      if (Array.isArray(val)) {
        if (val.length === 0) {
          lines.push(`${key}: []`);
        } else {
          lines.push(`${key}:`);
          val.forEach((v: string) => {
            const str = String(v);
            if (/^\d+$/.test(str)) lines.push(`  - "${str}"`);
            else lines.push(`  - ${str}`);
          });
        }
      } else if (typeof val === "boolean" || typeof val === "number") {
        lines.push(`${key}: ${val}`);
      } else {
        const str = String(val);
        if (str.includes(":") || str.includes("#") || str.includes('"')) {
          lines.push(`${key}: "${str.replace(/"/g, '\\"')}"`);
        } else {
          lines.push(`${key}: ${str}`);
        }
      }
    }
    lines.push("---");

    const output = lines.join("\n") + "\n\n" + content.trim() + "\n";
    fs.writeFileSync(absPath, output, "utf-8");

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
