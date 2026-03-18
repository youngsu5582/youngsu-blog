import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content");

// GET: 파일의 frontmatter 읽기
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

  if (!filePath) {
    return NextResponse.json({ error: "file parameter required" }, { status: 400 });
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
