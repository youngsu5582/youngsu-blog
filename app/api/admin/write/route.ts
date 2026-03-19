import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const { collection, title, slug: customSlug, description, categories, tags, thumbnail, content: body, related } = await req.json();

    const slug = customSlug || generateSlug(title);
    if (!slug) {
      return NextResponse.json({ success: false, error: "유효한 제목 또는 slug을 입력하세요" }, { status: 400 });
    }

    const contentDir = path.join(process.cwd(), "content", collection);
    const filePath = path.join(contentDir, `${slug}.mdx`);

    if (fs.existsSync(filePath)) {
      return NextResponse.json({ success: false, error: `파일이 이미 존재합니다: ${slug}.mdx` }, { status: 400 });
    }

    const today = new Date().toISOString().split("T")[0];
    const lines = ["---"];
    lines.push(`title: "${title}"`);
    lines.push(`date: ${today}`);
    if (description) lines.push(`description: "${description}"`);
    if (categories?.length > 0) { lines.push("categories:"); categories.forEach((c: string) => lines.push(`  - ${c}`)); }
    else lines.push("categories: []");
    if (tags?.length > 0) { lines.push("tags:"); tags.forEach((t: string) => lines.push(`  - ${t}`)); }
    else lines.push("tags: []");
    if (thumbnail) lines.push(`image: "${thumbnail}"`);
    if (related?.length > 0) { lines.push("related:"); related.forEach((r: string) => lines.push(`  - ${r}`)); }

    // Collection-specific fields
    if (collection === "posts") {
      lines.push('author: 이영수');
      lines.push("lang: ko");
      lines.push("draft: false");
      lines.push("toc: true");
      lines.push("comments: true");
    } else if (collection === "articles") {
      lines.push("status: seed");
    } else if (collection === "library") {
      lines.push("mediaType: book");
    }

    lines.push("---");
    lines.push("");
    lines.push((body || "").trim());
    lines.push("");

    if (!fs.existsSync(contentDir)) fs.mkdirSync(contentDir, { recursive: true });
    fs.writeFileSync(filePath, lines.join("\n"), "utf-8");

    return NextResponse.json({ success: true, filePath: `content/${collection}/${slug}.mdx`, slug });
  } catch (error) {
    console.error("Write error:", error);
    return NextResponse.json({ success: false, error: "파일 저장 실패" }, { status: 500 });
  }
}
