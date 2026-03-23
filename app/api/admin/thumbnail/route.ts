import { NextResponse } from "next/server";
import fs from "fs";
import matter from "gray-matter";

export async function POST(req: Request) {
  try {
    const { filePath, model } = await req.json();

    if (!filePath) {
      return NextResponse.json({ error: "filePath가 필요합니다" }, { status: 400 });
    }

    const selectedModel = model || "gemini-2.5-flash-image";

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY가 설정되지 않았습니다" },
        { status: 500 }
      );
    }

    // Read MDX file
    const absPath = filePath.startsWith("/")
      ? filePath
      : `${process.cwd()}/${filePath}`;

    if (!fs.existsSync(absPath)) {
      return NextResponse.json({ error: "파일을 찾을 수 없습니다" }, { status: 404 });
    }

    const raw = fs.readFileSync(absPath, "utf-8");
    const { data, content } = matter(raw);

    const title = data.title || "Untitled";
    const description = data.description || "";
    const contentPreview = content.slice(0, 2000);

    // Step 1: Generate image prompt using Gemini text API
    const promptGenerationRequest = {
      contents: [
        {
          parts: [
            {
              text: `You are a professional thumbnail designer for a tech blog. Create a detailed image generation prompt for a blog post thumbnail in a cute, kawaii illustration style.

Blog Post Information:
- Title: ${title}
- Description: ${description}
- Content Preview: ${contentPreview}

Generate a detailed English prompt for an image generation AI that will create a cute, friendly tech blog thumbnail. The thumbnail MUST follow these style guidelines:

STYLE REQUIREMENTS:
- Cute cartoon/illustration style with kawaii aesthetic
- Pastel color palette (soft blue, pink, yellow, mint, lavender)
- Include small cute character/mascot (chibi style programmer, friendly robot, or tech animal)
- Clean infographic-like layout with visual hierarchy
- Card-based or section-based organization
- Minimal, rounded shapes and soft edges
- Tech/development theme elements (code symbols, screens, clouds, gears)
- Professional but approachable and friendly feel
- 16:9 aspect ratio optimized

TEXT IN IMAGE:
- Include the blog post title "${title}" as prominent text in the image
- If the title is Korean, use Korean text
- The title should be clearly readable, large, and well-positioned (center or top area)
- Optionally include a short subtitle or description below the title
- Use clean, modern typography that fits the cute illustration style
- Text should have good contrast against the background

COMPOSITION:
- Keep the overall layout clean and uncluttered
- Balance text and illustrations harmoniously

Return ONLY the image generation prompt as plain text, nothing else.`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    };

    const promptRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(promptGenerationRequest),
      }
    );

    if (!promptRes.ok) {
      const errorData = await promptRes.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: `프롬프트 생성 실패 (${promptRes.status}): ${errorData.error?.message || "알 수 없는 오류"}`,
        },
        { status: 500 }
      );
    }

    const promptData = await promptRes.json();
    const imagePrompt = promptData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!imagePrompt) {
      return NextResponse.json(
        { error: "이미지 프롬프트를 생성할 수 없습니다" },
        { status: 500 }
      );
    }

    // Step 2: Generate image using selected Gemini model
    let base64Image: string | null = null;
    let generationMethod = "";
    let imageError = "";

    try {
      const geminiImageRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Generate a high-resolution (at least 2048x2048 pixels) thumbnail image for a tech blog post. ${imagePrompt}`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseModalities: ["IMAGE", "TEXT"],
            },
          }),
        }
      );

      if (geminiImageRes.ok) {
        const geminiImageData = await geminiImageRes.json();
        const parts = geminiImageData.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.data) {
            base64Image = part.inlineData.data;
            generationMethod = selectedModel;
            break;
          }
        }
        if (!base64Image) {
          imageError = "Gemini가 이미지를 반환하지 않았습니다. 텍스트만 응답됨.";
        }
      } else {
        const errData = await geminiImageRes.json().catch(() => ({}));
        imageError = `Gemini ${geminiImageRes.status}: ${errData.error?.message || "알 수 없는 오류"}`;
      }
    } catch (e: any) {
      imageError = `Gemini 요청 실패: ${e.message}`;
    }

    if (!base64Image) {
      return NextResponse.json(
        { error: `이미지 생성 실패. ${imageError}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      base64: base64Image,
      prompt: imagePrompt,
      method: generationMethod,
    });
  } catch (err: any) {
    console.error("Thumbnail generation error:", err);
    return NextResponse.json(
      { error: `썸네일 생성 실패: ${err.message || String(err)}` },
      { status: 500 }
    );
  }
}
