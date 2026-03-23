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
- Include a cute male character/mascot (chibi style young male programmer with short brown hair, friendly expression)
- Clean infographic-like layout with visual hierarchy
- Card-based or section-based organization
- Minimal, rounded shapes and soft edges
- Tech/development theme elements (code symbols, screens, clouds, gears)
- Professional but approachable and friendly feel
- 16:9 aspect ratio optimized

TEXT IN IMAGE:
- Include the blog post title "${title}" as prominent text in the image
- The title MUST be in Korean (한국어) — render Korean characters accurately and clearly
- The title should be clearly readable, large, bold, and well-positioned (center or top area)
- Optionally include a short Korean subtitle or description below the title
- Use clean, modern sans-serif typography (similar to Pretendard or Noto Sans KR)
- Text should have strong contrast against the background
- CRITICAL: Korean text must be legible and not distorted — each character should be recognizable

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

    // Step 2: Generate image using selected model
    let base64Image: string | null = null;
    let generationMethod = "";
    let imageError = "";

    const isImagenModel = selectedModel.startsWith("imagen");

    try {
      if (isImagenModel) {
        // Imagen API uses different endpoint and format
        const imagenRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:predict?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              instances: [{ prompt: `High-resolution tech blog thumbnail. ${imagePrompt}` }],
              parameters: {
                sampleCount: 1,
                aspectRatio: "16:9",
              },
            }),
          }
        );

        if (imagenRes.ok) {
          const imagenData = await imagenRes.json();
          base64Image = imagenData.predictions?.[0]?.bytesBase64Encoded;
          generationMethod = selectedModel;
        } else {
          const errData = await imagenRes.json().catch(() => ({}));
          imageError = `Imagen ${imagenRes.status}: ${errData.error?.message || "알 수 없는 오류"}`;
        }
      } else {
        // Gemini API
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
      }
    } catch (e: any) {
      imageError = `이미지 생성 요청 실패: ${e.message}`;
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
