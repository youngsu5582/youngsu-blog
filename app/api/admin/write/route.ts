import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface WriteRequest {
  collection: "posts" | "articles" | "notes" | "library";
  frontmatter: {
    title: string;
    description: string;
    categories: string[];
    tags: string[];
    image?: string;
  };
  body: string;
}

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
    const { collection, frontmatter, body } = (await req.json()) as WriteRequest;

    // Generate slug from title
    const slug = generateSlug(frontmatter.title);
    if (!slug) {
      return NextResponse.json({ success: false, error: "유효한 제목을 입력하세요" }, { status: 400 });
    }

    // Create file path
    const contentDir = path.join(process.cwd(), "content", collection);
    const filePath = path.join(contentDir, `${slug}.mdx`);

    // Check if file already exists
    if (fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: `파일이 이미 존재합니다: ${slug}.mdx` },
        { status: 400 }
      );
    }

    // Build frontmatter
    const today = new Date().toISOString().split("T")[0];
    const fm = {
      title: frontmatter.title,
      description: frontmatter.description,
      date: today,
      ...(frontmatter.categories.length > 0 && { categories: frontmatter.categories }),
      ...(frontmatter.tags.length > 0 && { tags: frontmatter.tags }),
      ...(frontmatter.image && { image: frontmatter.image }),
      draft: false,
      ...(collection === "posts" && {
        author: "Young",
        lang: "ko",
        comments: true,
        toc: true,
      }),
      ...(collection === "articles" && {
        status: "published",
        moc: "",
      }),
      ...(collection === "library" && {
        mediaType: "book",
        rating: 0,
      }),
    };

    // Build file content
    const lines = ["---"];
    Object.entries(fm).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        lines.push(`${key}:`);
        value.forEach((v) => lines.push(`  - ${v}`));
      } else if (typeof value === "string") {
        lines.push(`${key}: "${value}"`);
      } else {
        lines.push(`${key}: ${value}`);
      }
    });
    lines.push("---");
    lines.push("");
    lines.push(body.trim());
    lines.push("");

    const content = lines.join("\n");

    // Ensure directory exists
    if (!fs.existsSync(contentDir)) {
      fs.mkdirSync(contentDir, { recursive: true });
    }

    // Write file
    fs.writeFileSync(filePath, content, "utf-8");

    return NextResponse.json({
      success: true,
      filePath: `content/${collection}/${slug}.mdx`,
      slug,
    });
  } catch (error) {
    console.error("Write error:", error);
    return NextResponse.json(
      { success: false, error: "파일 저장 실패" },
      { status: 500 }
    );
  }
}
