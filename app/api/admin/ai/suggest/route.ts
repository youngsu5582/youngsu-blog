import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

export async function POST(req: Request) {
  const { filePath, existingCategories, existingTags } = await req.json();

  // Check for available AI
  if (!OPENAI_KEY && !GEMINI_KEY) {
    return NextResponse.json({ error: "AI API 키가 설정되지 않았습니다. .env.local에 OPENAI_API_KEY 또는 GEMINI_API_KEY를 추가하세요." }, { status: 400 });
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
    let result: { description: string; categories: string[]; tags: string[] };

    if (OPENAI_KEY) {
      // OpenAI
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          response_format: { type: "json_object" },
        }),
      });
      const data = await res.json();
      result = JSON.parse(data.choices[0].message.content);
    } else {
      // Gemini
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, responseMimeType: "application/json" },
          }),
        }
      );
      const data = await res.json();
      const text = data.candidates[0].content.parts[0].text;
      result = JSON.parse(text);
    }

    return NextResponse.json({
      success: true,
      model: OPENAI_KEY ? "OpenAI" : "Gemini",
      suggestion: result,
    });
  } catch (err) {
    return NextResponse.json({ error: `AI 요청 실패: ${String(err)}` }, { status: 500 });
  }
}
