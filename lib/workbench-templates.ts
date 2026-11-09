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
/** 리뷰는 글 전체를 읽고 발행 여부까지 판단하므로 메타데이터 · 번역과 따로 고른다. 실제 호출로 확인된 모델이다. */
const REVIEW_MODEL = "gpt-5.6-terra";
/** 미검증. 첫 실행이 실패하면 실제 호출로 확인된 gpt-image-2 로 되돌린다. */
const IMAGE_MODEL = "gpt-image-2.5-sunburst";

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
    model: REVIEW_MODEL,
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
      instructions: "당신은 한국어 기술 블로그 글을 자연스러운 영어로 옮기는 전문 기술 번역가입니다.",
      prompt: `다음 한국어 블로그 글을 영어로 번역해 주세요. 결과의 모든 값은 영어로 씁니다.

지켜야 할 것:
1. frontmatter(제목 · 설명 · 카테고리 · 태그)와 본문 마크다운을 모두 번역합니다
2. 코드 블록, URL, 이미지 링크, 기술 용어는 바꾸지 않습니다
3. 마크다운 서식(제목, 목록, 링크, 강조 등)을 그대로 유지합니다
4. 태그는 소문자 영어 단어로 씁니다 (예: "동시성" → "concurrency")
5. 카테고리는 대문자로 시작하는 영어로 씁니다 (예: "백엔드" → "Backend")

원문 frontmatter:
제목: {{title}}
설명: {{description}}
카테고리: {{categories}}
태그: {{tags}}

원문 본문:
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
      // 해상도는 긴 변이다. 16:9 @ 1k 는 1024x576 이라 OpenAI 의 최소 픽셀 수에 못 미쳐 거절된다. 2k 는 2048x1152.
      size: { type: "ratio", ratio: "16:9", resolution: "2k" },
      quality: "auto",
      prompt: `기술 블로그 글의 썸네일을 귀여운 카와이 일러스트 스타일로 만들어 주세요.

블로그 글:
- 제목: {{title}}
- 설명: {{description}}

스타일:
- 파스텔 색감(연한 파랑, 분홍, 노랑, 민트, 라벤더)의 카와이 카툰 일러스트
- 짧은 갈색 머리의 귀여운 치비 스타일 젊은 남자 개발자 마스코트
- 둥근 도형과 글 주제에 맞는 기술 요소(코드 기호, 화면, 구름, 톱니바퀴)를 담은 인포그래픽 · 카드 레이아웃
- 깔끔하고 여백이 있는 균형 잡힌 구도

이미지 속 글자:
- 제목 "{{title}}" 을 주어진 한국어 그대로 크게 넣습니다
- Pretendard 나 Noto Sans KR 같은 굵고 읽기 쉬운 고딕체로, 배경과 대비가 강하게 씁니다`,
    },
  },
};
