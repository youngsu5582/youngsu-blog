import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { execSync } from "child_process";

const CONTENT_DIR = path.join(process.cwd(), "content/posts");

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
    const { slug, frontmatter, includeEn, enSlug } = await req.json();
    const cwd = process.cwd();
    const filesToCommit: string[] = [];

    // Update Korean post frontmatter
    const koFile = path.join(CONTENT_DIR, `${slug}.mdx`);
    if (fs.existsSync(koFile)) {
      // Remove draft flag on publish
      updateFrontmatter(koFile, { ...frontmatter, draft: false });
      filesToCommit.push(`content/posts/${slug}.mdx`);
    }

    // Update English post frontmatter (sync categories, tags)
    if (includeEn && enSlug) {
      const enFile = path.join(CONTENT_DIR, `${enSlug}.mdx`);
      if (fs.existsSync(enFile)) {
        updateFrontmatter(enFile, {
          categories: frontmatter.categories,
          tags: frontmatter.tags,
          image: frontmatter.image,
          draft: false,
        });
        filesToCommit.push(`content/posts/${enSlug}.mdx`);
      }
    }

    if (filesToCommit.length === 0) {
      return NextResponse.json({ error: "발행할 파일이 없습니다" }, { status: 400 });
    }

    // Git commit
    for (const f of filesToCommit) {
      execSync(`git add "${f}"`, { cwd });
    }

    const msg = `docs: '${frontmatter.title || slug}' 발행`;
    const tmpFile = "/tmp/admin-publish-msg.txt";
    fs.writeFileSync(tmpFile, msg, "utf-8");
    execSync(`git commit -F ${tmpFile}`, { cwd, encoding: "utf-8" });
    fs.unlinkSync(tmpFile);

    const hash = execSync("git rev-parse --short HEAD", { cwd, encoding: "utf-8" }).trim();

    return NextResponse.json({
      success: true,
      hash,
      files: filesToCommit,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
