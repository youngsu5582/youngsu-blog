import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { executeAi, type AiProvider } from "@/lib/ai-provider";

export async function POST(req: Request) {
  try {
    const { filePath, provider } = await req.json();

    if (!filePath || !provider) {
      return NextResponse.json(
        { success: false, error: "filePath와 provider는 필수입니다" },
        { status: 400 }
      );
    }

    const absPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(absPath)) {
      return NextResponse.json(
        { success: false, error: "파일을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // Read Korean MDX file
    const raw = fs.readFileSync(absPath, "utf-8");
    const { data: frontmatter, content } = matter(raw);

    // Construct translation prompt
    const prompt = `You are a professional technical translator. Translate the following Korean blog post to English.

IMPORTANT INSTRUCTIONS:
1. Translate the frontmatter fields (title, description, categories, tags) and the markdown content
2. Keep ALL code blocks, URLs, image links, and technical terms UNCHANGED
3. Preserve ALL markdown formatting (headings, lists, links, emphasis, etc.)
4. Tags should be lowercase English words (e.g., "동시성" → "concurrency")
5. Categories should be proper English (e.g., "백엔드" → "Backend")
6. Return ONLY valid JSON in this exact format:

{
  "title": "Translated title",
  "description": "Translated description",
  "categories": ["Category1", "Category2"],
  "tags": ["tag1", "tag2"],
  "content": "Translated markdown content with preserved formatting"
}

ORIGINAL FRONTMATTER:
Title: ${frontmatter.title || ""}
Description: ${frontmatter.description || ""}
Categories: ${(frontmatter.categories as string[] || []).join(", ")}
Tags: ${(frontmatter.tags as string[] || []).join(", ")}

ORIGINAL CONTENT:
${content}

Translate to English and return JSON only.`;

    // Execute AI translation
    const response = await executeAi({
      provider: provider as AiProvider,
      prompt,
    });

    if (!response.success) {
      return NextResponse.json({
        success: false,
        error: response.error || "번역 실패",
      });
    }

    let translation = response.result;

    // result가 문자열인 경우 JSON 파싱 시도
    if (typeof translation === "string") {
      try {
        const jsonMatch = translation.match(/\{[\s\S]*\}/);
        if (jsonMatch) translation = JSON.parse(jsonMatch[0]);
      } catch {
        return NextResponse.json({
          success: false,
          error: "번역 응답을 파싱할 수 없습니다. 다시 시도해주세요.",
        });
      }
    }

    return NextResponse.json({
      success: true,
      provider: response.provider,
      originalContent: content,
      translation: {
        title: translation.title || frontmatter.title,
        description: translation.description || frontmatter.description,
        categories: translation.categories || frontmatter.categories || [],
        tags: translation.tags || frontmatter.tags || [],
        content: translation.content || content,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || String(err) },
      { status: 500 }
    );
  }
}
