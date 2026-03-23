import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { executeAi, getAvailableProviders, type AiProvider } from "@/lib/ai-provider";

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

    const absPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(absPath)) {
      return NextResponse.json({ error: "파일을 찾을 수 없습니다" }, { status: 404 });
    }

    const raw = fs.readFileSync(absPath, "utf-8");
    const { data, content } = matter(raw);

    const prompt = `당신은 기술 블로그 전문 에디터입니다. 다음 한국어 기술 블로그 포스트를 상세히 리뷰해주세요.

포스트 정보:
- 제목: ${data.title || ""}
- 설명: ${data.description || ""}
- 카테고리: ${(data.categories || []).join(", ")}

포스트 본문:
${content}

아래 항목들을 마크다운 형식으로 리뷰해주세요:

## 📝 글의 흐름
- 서론 → 본론 → 결론 구조가 자연스러운지
- 섹션 간 전환이 매끄러운지

## 🔍 문맥 및 논리
- 논리적 비약이 없는지
- 설명이 충분한지, 독자가 따라가기 쉬운지

## ✅ 좋은 점
- 잘 작성된 부분 구체적으로 언급

## ⚠️ 개선할 점
- 부족한 부분과 구체적인 개선 제안

## 📖 맞춤법 및 표현
- 맞춤법 오류나 어색한 표현 (있다면 수정 제안 포함)

## ⭐ 종합 평가
- 5점 만점 평가
- 한 줄 총평

솔직하고 건설적인 피드백을 한국어로 제공하세요. 마크다운 형식을 유지하세요.`;

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
  } catch (err: any) {
    return NextResponse.json({ error: `리뷰 실패: ${err.message || String(err)}` }, { status: 500 });
  }
}
