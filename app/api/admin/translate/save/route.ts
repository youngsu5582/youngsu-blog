import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

export async function POST(req: Request) {
  try {
    const { originalPath, title, description, categories, tags, content, overwrite = false } =
      await req.json();

    if (!originalPath || !title || !content) {
      return NextResponse.json(
        { success: false, error: "필수 필드가 누락되었습니다" },
        { status: 400 }
      );
    }

    // Read original file to get date, image, author
    const absOriginalPath = path.join(process.cwd(), originalPath);
    if (!fs.existsSync(absOriginalPath)) {
      return NextResponse.json(
        { success: false, error: "원본 파일을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    const originalRaw = fs.readFileSync(absOriginalPath, "utf-8");
    const { data: originalFrontmatter } = matter(originalRaw);

    // Generate English filename
    const enFilePath = originalPath.replace(/\.mdx?$/, "-en.mdx");
    const absEnPath = path.join(process.cwd(), enFilePath);

    // Check if file already exists
    const fileExists = fs.existsSync(absEnPath);
    if (fileExists && !overwrite) {
      return NextResponse.json(
        {
          success: false,
          error: "이미 영어 번역본이 있습니다. 덮어쓰려면 overwrite=true로 다시 요청하세요.",
          enPath: enFilePath,
          requiresOverwrite: true,
        },
        { status: 409 }
      );
    }

    // Construct English frontmatter
    const enFrontmatter: Record<string, any> = {
      title,
      date: originalFrontmatter.date,
      description,
      categories,
      tags,
    };

    if (originalFrontmatter.image) {
      enFrontmatter.image = originalFrontmatter.image;
    }

    if (originalFrontmatter.author) {
      enFrontmatter.author = originalFrontmatter.author;
    }

    enFrontmatter.lang = "en";

    // Build frontmatter lines
    const lines = ["---"];
    for (const [key, val] of Object.entries(enFrontmatter)) {
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
    fs.writeFileSync(absEnPath, output, "utf-8");

    return NextResponse.json({
      success: true,
      filePath: enFilePath,
      existed: fileExists,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || String(err) },
      { status: 500 }
    );
  }
}
