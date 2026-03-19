import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content");

function updateFrontmatter(filePath: string, updates: Record<string, unknown>) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  // Merge updates into existing frontmatter
  const merged = { ...data, ...updates };

  // Rebuild
  const lines = ["---"];
  for (const [key, val] of Object.entries(merged)) {
    if (val === undefined || val === null) continue;
    if (Array.isArray(val)) {
      if (val.length === 0) {
        lines.push(`${key}: []`);
      } else {
        lines.push(`${key}:`);
        val.forEach((v: string) => {
          const str = String(v);
          lines.push(/^\d+$/.test(str) ? `  - "${str}"` : `  - ${str}`);
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

  fs.writeFileSync(filePath, lines.join("\n") + "\n\n" + content.trim() + "\n", "utf-8");
}

export async function POST(req: Request) {
  try {
    const { files, action, value } = await req.json();

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "파일이 선택되지 않았습니다" }, { status: 400 });
    }

    let updated = 0;

    for (const filePath of files) {
      const absPath = path.join(process.cwd(), filePath);
      if (!fs.existsSync(absPath)) continue;

      const raw = fs.readFileSync(absPath, "utf-8");
      const { data } = matter(raw);

      let newData: Record<string, unknown> = {};

      if (action === "addTag") {
        const tags = Array.isArray(value) ? value : [value];
        const existingTags = Array.isArray(data.tags) ? data.tags : [];
        const newTags = [...new Set([...existingTags, ...tags])];
        newData = { tags: newTags };
      } else if (action === "removeTag") {
        const tags = Array.isArray(value) ? value : [value];
        const existingTags = Array.isArray(data.tags) ? data.tags : [];
        const newTags = existingTags.filter((t: string) => !tags.includes(t));
        newData = { tags: newTags };
      } else if (action === "setCategory") {
        const categories = Array.isArray(value) ? value : [value];
        newData = { categories };
      }

      updateFrontmatter(absPath, newData);
      updated++;
    }

    return NextResponse.json({ success: true, updated });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
