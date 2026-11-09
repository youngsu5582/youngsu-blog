import { buildAiReviewPrompt } from "@/lib/admin-ai-review-prompt";

/**
 * Admin 의 AI 기능이 워크벤치에서 쓰는 템플릿.
 *
 * 프롬프트 · 모델 · 출력 모양은 여기가 정본이고, `pnpm workbench:sync` 가 이름으로 찾아 워크벤치에 만들거나 고친다.
 * 워크벤치 콘솔에서 고친 내용은 다음 sync 에 덮인다 — 콘솔은 결과를 보고 시험 실행하는 곳이다.
 * 블로그는 실행할 때 변수만 채워 보낸다. 변수 이름은 영문자 · 숫자 · 밑줄이다.
 */
export type WorkbenchFeature = "suggest" | "review" | "translate" | "thumbnail";

export interface WorkbenchTemplate {
  name: string;
  option: Record<string, unknown>;
  inputImageCount: number;
  /** 실행할 때 모델을 따로 주지 않으므로, 템플릿의 기본 모델이 곧 쓰는 모델이다. */
  model: string;
}

/** 썸네일 화면의 모델 목록에서 워크벤치를 가리키는 값. 실제 모델은 템플릿이 정한다. */
export const WORKBENCH_THUMBNAIL_MODEL = "workbench";

/** 실제 호출로 확인된 모델 중 가장 싸고, strict JSON Schema 를 지킨다. */
const TEXT_MODEL = "gpt-6-luna";
const IMAGE_MODEL = "gpt-image-2";

/** OpenAI strict 모드는 모든 속성이 required 이고 추가 속성이 없어야 받는다. */
function strictObject(properties: Record<string, unknown>) {
  return { type: "object", properties, required: Object.keys(properties), additionalProperties: false };
}

const stringList = { type: "array", items: { type: "string" } };

export const WORKBENCH_TEMPLATES: Record<WorkbenchFeature, WorkbenchTemplate> = {
  suggest: {
    name: "블로그 · 메타데이터 제안",
    model: TEXT_MODEL,
    inputImageCount: 0,
    option: {
      type: "text-generate",
      prompt: `다음 기술 블로그 포스트에 맞는 메타데이터를 제안해주세요.

기존 카테고리 목록: [{{existing_categories}}]
기존 태그 목록: [{{existing_tags}}]

규칙:
- description: 1-2문장으로 포스트 요약 (한국어)
- categories: 기존 카테고리에서 선택하되, 적절한 것이 없으면 새로 만들어도 됨 (최대 2개)
- tags: 기존 태그에서 선택하되, 적절한 것이 없으면 새로 만들어도 됨 (최대 5개)

포스트 제목: {{title}}
포스트 내용:
{{content}}`,
      output: {
        type: "json-schema",
        schema: strictObject({ description: { type: "string" }, categories: stringList, tags: stringList }),
      },
    },
  },
  review: {
    name: "블로그 · 발행 전 리뷰",
    model: TEXT_MODEL,
    inputImageCount: 0,
    option: {
      type: "text-generate",
      // 리뷰 기준은 한 곳(admin-ai-review-prompt)에만 둔다. 값 자리에 변수를 넣어 그대로 템플릿으로 쓴다.
      prompt: buildAiReviewPrompt(
        { title: "{{title}}", description: "{{description}}", categories: ["{{categories}}"], tags: ["{{tags}}"], draft: "{{draft}}" },
        "{{content}}"
      ),
    },
  },
  translate: {
    name: "블로그 · 영어 번역",
    model: TEXT_MODEL,
    inputImageCount: 0,
    option: {
      type: "text-generate",
      instructions: "You are a professional technical translator. Translate Korean technical blog posts into natural English.",
      prompt: `Translate the following Korean blog post to English.

IMPORTANT INSTRUCTIONS:
1. Translate the frontmatter fields (title, description, categories, tags) and the markdown content
2. Keep ALL code blocks, URLs, image links, and technical terms UNCHANGED
3. Preserve ALL markdown formatting (headings, lists, links, emphasis, etc.)
4. Tags should be lowercase English words (e.g., "동시성" → "concurrency")
5. Categories should be proper English (e.g., "백엔드" → "Backend")

ORIGINAL FRONTMATTER:
Title: {{title}}
Description: {{description}}
Categories: {{categories}}
Tags: {{tags}}

ORIGINAL CONTENT:
{{content}}`,
      output: {
        type: "json-schema",
        schema: strictObject({
          title: { type: "string" },
          description: { type: "string" },
          categories: stringList,
          tags: stringList,
          content: { type: "string" },
        }),
      },
    },
  },
  thumbnail: {
    name: "블로그 · 썸네일",
    model: IMAGE_MODEL,
    inputImageCount: 0,
    option: {
      type: "image-generate",
      size: { type: "ratio", ratio: "16:9", resolution: "1k" },
      quality: "auto",
      prompt: `Create a thumbnail for a tech blog post in a cute, kawaii illustration style.

Blog post:
- Title: {{title}}
- Description: {{description}}

STYLE:
- Kawaii cartoon illustration with a pastel palette (soft blue, pink, yellow, mint, lavender)
- A cute chibi young male programmer mascot with short brown hair
- Infographic / card layout with rounded shapes and tech elements (code symbols, screens, clouds, gears) related to the topic
- Clean, uncluttered, balanced composition

TEXT IN IMAGE:
- Show the title "{{title}}" prominently, in Korean exactly as given
- Large, bold, legible sans-serif lettering (like Pretendard or Noto Sans KR) with strong contrast`,
    },
  },
};
