import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { executeAi, getAvailableProviders, type AiProvider } from "@/lib/ai-provider";

export async function POST(req: Request) {
  const { filePath, existingCategories, existingTags, provider } = await req.json();

  // Check for available AI providers
  const availableProviders = getAvailableProviders();
  const hasAnyProvider = availableProviders.some((p) => p.available);

  if (!hasAnyProvider) {
    return NextResponse.json({
      error: "사용 가능한 AI 프로바이더가 없습니다. API 키를 설정하거나 CLI 도구를 설치하세요."
    }, { status: 400 });
  }

  // Determine which provider to use
  let selectedProvider: AiProvider;
  if (provider) {
    // Use explicitly requested provider
    const providerInfo = availableProviders.find((p) => p.id === provider);
    if (!providerInfo || !providerInfo.available) {
      return NextResponse.json({
        error: `선택한 프로바이더(${provider})를 사용할 수 없습니다`
      }, { status: 400 });
    }
    selectedProvider = provider;
  } else {
    // Fall back to first available provider
    const firstAvailable = availableProviders.find((p) => p.available);
    if (!firstAvailable) {
      return NextResponse.json({
        error: "사용 가능한 AI 프로바이더가 없습니다"
      }, { status: 400 });
    }
    selectedProvider = firstAvailable.id;
  }

  // Read post content
  const absPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(absPath)) {
    return NextResponse.json({ error: "파일을 찾을 수 없습니다" }, { status: 404 });
  }

  const raw = fs.readFileSync(absPath, "utf-8");
  const { content, data } = matter(raw);
  const truncatedContent = content.substring(0, 3000); // Limit for API

  const prompt = `다음은 기술 블로그 포스트 내용입니다. 이 포스트에 적합한 메타데이터를 JSON으로 제안해주세요.

기존 카테고리 목록: [${existingCategories.join(", ")}]
기존 태그 목록: [${existingTags.join(", ")}]

규칙:
- description: 1-2문장으로 포스트 요약 (한국어)
- categories: 기존 카테고리에서 선택하되, 적절한 것이 없으면 새로 만들어도 됨 (최대 2개)
- tags: 기존 태그에서 선택하되, 적절한 것이 없으면 새로 만들어도 됨 (최대 5개)

포스트 제목: ${data.title || ""}
포스트 내용:
${truncatedContent}

반드시 다음 JSON 형식으로만 응답하세요:
{"description": "...", "categories": ["...", "..."], "tags": ["...", "...", "..."]}`;

  try {
    // Execute AI request
    const response = await executeAi({
      provider: selectedProvider,
      prompt,
    });

    if (!response.success) {
      return NextResponse.json({ error: response.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      model: response.provider,
      suggestion: response.result,
    });
  } catch (err) {
    return NextResponse.json({ error: `AI 요청 실패: ${String(err)}` }, { status: 500 });
  }
}
