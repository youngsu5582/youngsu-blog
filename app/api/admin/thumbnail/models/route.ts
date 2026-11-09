import { NextResponse } from "next/server";
import { isWorkbenchConfigured } from "@/lib/workbench";
import { WORKBENCH_TEMPLATES, WORKBENCH_THUMBNAIL_MODEL } from "@/lib/workbench-templates";

interface ThumbnailModel {
  id: string;
  displayName: string;
  description: string;
}

/** 워크벤치가 설정돼 있으면 맨 앞에 둔다. 화면은 첫 항목을 기본으로 고른다. */
function workbenchModels(): ThumbnailModel[] {
  if (!isWorkbenchConfigured()) return [];
  const template = WORKBENCH_TEMPLATES.thumbnail;
  return [
    {
      id: WORKBENCH_THUMBNAIL_MODEL,
      displayName: `Workbench · ${template.model}`,
      description: `워크벤치 템플릿 '${template.name}' 으로 만듭니다. 비용은 워크벤치 사용량에 남습니다.`,
    },
  ];
}

export async function GET() {
  try {
    const workbench = workbenchModels();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      if (workbench.length > 0) return NextResponse.json({ models: workbench });
      return NextResponse.json(
        { error: "GEMINI_API_KEY가 설정되지 않았습니다" },
        { status: 500 }
      );
    }

    // Hardcoded curated list of known image-capable models
    const curatedModels = [
      {
        id: "imagen-4.0-generate-001",
        displayName: "Imagen 4 (고화질, 유료)",
        description: "Google 최고 화질 이미지 생성 모델",
      },
      {
        id: "gemini-3.1-flash-image-preview",
        displayName: "Nano Banana 2 (최신, 한글 우수)",
        description: "최신 이미지 생성 모델, 한글 텍스트 렌더링 개선",
      },
      {
        id: "gemini-2.5-flash-image",
        displayName: "Gemini 2.5 Flash Image",
        description: "빠른 이미지 생성에 최적화된 모델",
      },
    ];

    // Try to fetch models from API
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );

      if (res.ok) {
        const data = await res.json();
        const models = data.models || [];

        // Filter models that specifically support image generation
        // Only models with "image" in the name are confirmed image generators
        const imageModels = models.filter((model: any) => {
          const name = (model.name || "").toLowerCase();
          return name.includes("image");
        });

        if (imageModels.length > 0) {
          const formattedModels = imageModels.map((model: any) => ({
            id: model.name.replace("models/", ""),
            displayName: model.displayName || model.name.replace("models/", ""),
            description: model.description || "이미지 생성 지원 모델",
          }));

          return NextResponse.json({ models: [...workbench, ...formattedModels] });
        }
      }
    } catch (apiError) {
      console.warn("Failed to fetch models from API, using curated list", apiError);
    }

    // Fallback to curated list
    return NextResponse.json({ models: [...workbench, ...curatedModels] });
  } catch (err: any) {
    console.error("Models fetch error:", err);
    return NextResponse.json(
      { error: `모델 목록 조회 실패: ${err.message || String(err)}` },
      { status: 500 }
    );
  }
}
