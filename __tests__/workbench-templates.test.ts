import { describe, expect, it } from "vitest";

import { WORKBENCH_TEMPLATES, type WorkbenchFeature } from "@/lib/workbench-templates";

/**
 * 워크벤치는 템플릿의 변수와 실행 때 보낸 변수가 정확히 같아야 받는다(다르면 400).
 * 라우트가 보내는 변수 이름을 여기 적어 두어, 프롬프트를 고치다 변수를 바꾸면 배포 전에 걸리게 한다.
 */
const SENT_BY_ROUTE: Record<WorkbenchFeature, string[]> = {
  suggest: ["title", "content", "existing_categories", "existing_tags"],
  review: ["title", "description", "categories", "tags", "draft", "content"],
  translate: ["title", "description", "categories", "tags", "content"],
  thumbnail: ["title", "description"],
};

function variablesOf(option: Record<string, unknown>): string[] {
  const text = [option.instructions, option.prompt].filter((v): v is string => typeof v === "string").join("\n");
  return [...new Set([...text.matchAll(/\{\{([A-Za-z_][A-Za-z0-9_]*)\}\}/g)].map((m) => m[1]))];
}

describe("워크벤치 템플릿 정의", () => {
  it.each(Object.keys(SENT_BY_ROUTE) as WorkbenchFeature[])("%s 템플릿의 변수는 라우트가 보내는 변수와 같다", (feature) => {
    expect(variablesOf(WORKBENCH_TEMPLATES[feature].option).sort()).toEqual([...SENT_BY_ROUTE[feature]].sort());
  });

  it("JSON 으로 받는 템플릿은 strict 스키마다 — 모든 속성이 필수이고 추가 속성이 없다", () => {
    for (const template of Object.values(WORKBENCH_TEMPLATES)) {
      const output = template.option.output as { type: string; schema: Record<string, unknown> } | undefined;
      if (!output) continue;
      expect(output.type).toBe("json-schema");
      expect(output.schema.additionalProperties).toBe(false);
      expect([...(output.schema.required as string[])].sort()).toEqual(Object.keys(output.schema.properties as object).sort());
    }
  });

  it("템플릿 이름은 서로 다르다 — sync 와 실행이 이름으로 찾는다", () => {
    const names = Object.values(WORKBENCH_TEMPLATES).map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
