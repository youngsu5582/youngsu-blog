import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { serializeFrontmatter } from "@/lib/frontmatter";
import { buildContentFilePath } from "@/lib/admin-content-paths";
import { buildSeriesFrontmatter, validateSeriesAssignment } from "@/lib/admin-series";

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
    const {
      collection,
      title,
      slug: customSlug,
      description,
      categories,
      tags,
      thumbnail,
      content: body,
      related,
      series,
      seriesOrder,
      seriesDescription,
      seriesStatus,
    } = await req.json();

    const targetCollection = collection || "posts";
    const slug = customSlug || generateSlug(title);
    if (!slug) {
      return NextResponse.json(
        { success: false, error: "유효한 제목 또는 slug을 입력하세요" },
        { status: 400 },
      );
    }

    const safePath = buildContentFilePath(targetCollection, slug);
    if (!safePath) {
      return NextResponse.json(
        { success: false, error: "허용되지 않는 collection 또는 slug입니다" },
        { status: 400 },
      );
    }
    const { contentDir, absPath: filePath } = safePath;

    const hasSeriesInput = [series, seriesOrder, seriesDescription, seriesStatus].some(
      (value) => value !== undefined && value !== "",
    );
    if (targetCollection !== "posts" && hasSeriesInput) {
      return NextResponse.json(
        { success: false, error: "시리즈는 현재 포스트에서만 사용할 수 있습니다" },
        { status: 400 },
      );
    }

    const seriesError = validateSeriesAssignment({
      series,
      seriesOrder,
      filePath: `content/${targetCollection}/${slug}.mdx`,
      requireOrder:
        targetCollection === "posts" && typeof series === "string" && series.trim().length > 0,
    });
    if (seriesError) {
      return NextResponse.json({ success: false, error: seriesError }, { status: 400 });
    }

    if (fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: `파일이 이미 존재합니다: ${slug}.mdx` },
        { status: 400 },
      );
    }

    const frontmatter: Record<string, unknown> = {
      title,
      date: new Date().toISOString().split("T")[0],
      description: description || undefined,
      categories: Array.isArray(categories) ? categories : [],
      tags: Array.isArray(tags) ? tags : [],
      image: thumbnail || undefined,
      related: Array.isArray(related) && related.length > 0 ? related : undefined,
    };

    // Collection-specific fields
    if (targetCollection === "posts") {
      Object.assign(frontmatter, {
        author: "이영수",
        lang: "ko",
        draft: false,
        toc: true,
        comments: true,
      });
    } else if (targetCollection === "articles") {
      frontmatter.status = "seed";
    } else if (targetCollection === "library") {
      frontmatter.mediaType = "book";
    }

    Object.assign(
      frontmatter,
      buildSeriesFrontmatter({ series, seriesOrder, seriesDescription, seriesStatus }),
    );

    const output = `${serializeFrontmatter(frontmatter)}\n\n${(body || "").trim()}\n`;

    if (!fs.existsSync(contentDir)) fs.mkdirSync(contentDir, { recursive: true });
    fs.writeFileSync(filePath, output, "utf-8");

    return NextResponse.json({
      success: true,
      filePath: `content/${targetCollection}/${slug}.mdx`,
      slug,
    });
  } catch (error) {
    console.error("Write error:", error);
    return NextResponse.json({ success: false, error: "파일 저장 실패" }, { status: 500 });
  }
}
