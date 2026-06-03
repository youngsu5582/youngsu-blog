import { NextResponse } from "next/server";
import fs from "fs";
import matter from "gray-matter";
import { resolveRepoFilePath } from "@/lib/admin-content-paths";
import { serializeFrontmatter } from "@/lib/frontmatter";

const ALLOWED_TRANSLATION_PREFIXES = [
  "content/posts/",
  "content/articles/",
  "content/notes/",
  "content/library/",
];

type TranslateSaveBody = {
  originalPath?: unknown;
  title?: unknown;
  description?: unknown;
  categories?: unknown;
  tags?: unknown;
  content?: unknown;
  overwrite?: unknown;
};

function resolveTranslationTargetPath(originalRepoPath: string) {
  if (!/\.mdx?$/.test(originalRepoPath)) return null;

  const enFilePath = originalRepoPath.replace(/\.mdx?$/, "-en.mdx");
  const resolved = resolveRepoFilePath(enFilePath, ALLOWED_TRANSLATION_PREFIXES);
  if (!resolved) return null;

  return resolved;
}

export async function POST(req: Request) {
  try {
    const { originalPath, title, description, categories, tags, content, overwrite = false } =
      (await req.json()) as TranslateSaveBody;

    if (typeof originalPath !== "string" || typeof title !== "string" || typeof content !== "string" || !title.trim() || !content.trim()) {
      return NextResponse.json(
        { success: false, error: "필수 필드가 누락되었습니다" },
        { status: 400 }
      );
    }

    const originalFile = resolveRepoFilePath(originalPath, ALLOWED_TRANSLATION_PREFIXES);
    if (!originalFile) {
      return NextResponse.json(
        { success: false, error: "잘못된 원본 파일 경로입니다" },
        { status: 400 }
      );
    }

    const enFile = resolveTranslationTargetPath(originalFile.repoPath);
    if (!enFile) {
      return NextResponse.json(
        { success: false, error: "잘못된 번역 파일 경로입니다" },
        { status: 400 }
      );
    }

    if (!fs.existsSync(originalFile.absPath)) {
      return NextResponse.json(
        { success: false, error: "원본 파일을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    const originalRaw = fs.readFileSync(originalFile.absPath, "utf-8");
    const { data: originalFrontmatter } = matter(originalRaw);

    const fileExists = fs.existsSync(enFile.absPath);
    if (fileExists && overwrite !== true) {
      return NextResponse.json(
        {
          success: false,
          error: "이미 영어 번역본이 있습니다. 덮어쓰려면 overwrite=true로 다시 요청하세요.",
          enPath: enFile.repoPath,
          requiresOverwrite: true,
        },
        { status: 409 }
      );
    }

    const enFrontmatter: Record<string, unknown> = {
      title,
      date: originalFrontmatter.date,
      description: typeof description === "string" ? description : "",
      categories: Array.isArray(categories) ? categories : [],
      tags: Array.isArray(tags) ? tags : [],
    };

    if (originalFrontmatter.image) {
      enFrontmatter.image = originalFrontmatter.image;
    }

    if (originalFrontmatter.author) {
      enFrontmatter.author = originalFrontmatter.author;
    }

    enFrontmatter.lang = "en";

    const output = `${serializeFrontmatter(enFrontmatter)}\n\n${content.trim()}\n`;
    fs.writeFileSync(enFile.absPath, output, "utf-8");

    return NextResponse.json({
      success: true,
      filePath: enFile.repoPath,
      existed: fileExists,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
