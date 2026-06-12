import { NextResponse } from "next/server";
import fs from "fs";
import matter from "gray-matter";
import { executeAi, getAvailableProviders, type AiProvider } from "@/lib/ai-provider";
import { resolveRepoFilePath } from "@/lib/admin-content-paths";
import { buildAiReviewPrompt } from "@/lib/admin-ai-review-prompt";

export async function POST(req: Request) {
  try {
    const { filePath, provider } = await req.json();

    if (!filePath) {
      return NextResponse.json({ error: "filePath가 필요합니다" }, { status: 400 });
    }

    const availableProviders = getAvailableProviders();
    let selectedProvider: AiProvider;

    if (provider) {
      const p = availableProviders.find((p) => p.id === provider && p.available);
      if (!p) {
        return NextResponse.json({ error: `프로바이더(${provider})를 사용할 수 없습니다` }, { status: 400 });
      }
      selectedProvider = provider;
    } else {
      const first = availableProviders.find((p) => p.available);
      if (!first) {
        return NextResponse.json({ error: "사용 가능한 AI가 없습니다" }, { status: 400 });
      }
      selectedProvider = first.id;
    }

    const resolved = typeof filePath === "string" ? resolveRepoFilePath(filePath, ["content/"]) : null;
    if (!resolved || !fs.existsSync(resolved.absPath)) {
      return NextResponse.json({ error: "파일을 찾을 수 없습니다" }, { status: 404 });
    }

    const raw = fs.readFileSync(resolved.absPath, "utf-8");
    const { data, content } = matter(raw);

    const prompt = buildAiReviewPrompt(data, content);

    const response = await executeAi({ provider: selectedProvider, prompt });

    if (!response.success) {
      return NextResponse.json({ error: response.error }, { status: 500 });
    }

    // result could be JSON or plain text (markdown)
    let reviewContent: string;
    if (typeof response.result === "string") {
      reviewContent = response.result;
    } else if (response.result?.review) {
      reviewContent = response.result.review;
    } else {
      // Try to extract text from the result
      reviewContent = JSON.stringify(response.result, null, 2);
    }

    return NextResponse.json({
      success: true,
      provider: response.provider,
      review: reviewContent,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `리뷰 실패: ${message}` }, { status: 500 });
  }
}
