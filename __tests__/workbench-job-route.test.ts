// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/admin/workbench/jobs/[uuid]/route";
import { resetWorkbenchTemplateCache } from "@/lib/workbench";
import { WORKBENCH_TEMPLATES } from "@/lib/workbench-templates";
import { closedTextJob } from "./fixtures/workbench-job";

vi.mock("@/lib/suggest-vocabulary", async () => {
  const { buildVocabulary } = await import("@/lib/taxonomy-vocabulary");
  return { loadSuggestVocabulary: (collection: string) => buildVocabulary([], collection) };
});

const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });

const schemaOf = (feature: "suggest" | "translate") => {
  const option = WORKBENCH_TEMPLATES[feature].option as { output: { schema: Record<string, unknown> } };
  return option.output.schema;
};

async function read(feature: string, workbenchBody: unknown) {
  vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(json(workbenchBody));
  const res = await GET(new Request(`http://blog.test/api/admin/workbench/jobs/job-1?feature=${feature}`), {
    params: Promise.resolve({ uuid: "job-1" }),
  });
  return res.json();
}

/** 워크벤치가 실제로 주는 응답 모양(`closedTextJob`)을 조회 경로 끝까지 통과시킨다. */
describe("워크벤치 작업 조회 경로", () => {
  beforeEach(() => {
    vi.stubEnv("WORKBENCH_BASE_URL", "https://workbench.test/");
    vi.stubEnv("WORKBENCH_API_KEY", "pawb_test");
    resetWorkbenchTemplateCache();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("제안은 워크벤치가 객체로 준 답을 다시 파싱하지 않고 받는다", async () => {
    const answer = { description: "요약", categories: ["Backend"], tags: ["spring"] };

    const data = await read("suggest", closedTextJob(answer, schemaOf("suggest")));

    expect(data.success).toBe(true);
    expect(data.suggestion.description).toBe("요약");
  });

  it("번역도 객체로 받은 답을 그대로 translation 으로 준다", async () => {
    const answer = { title: "Title", description: "Summary", categories: ["Backend"], tags: ["spring"], content: "Body" };

    const data = await read("translate", closedTextJob(answer, schemaOf("translate")));

    expect(data).toEqual({ success: true, provider: "workbench · gpt-6-luna", translation: answer });
  });

  it("리뷰는 형식 없는 글이라 문자열로 받는다", async () => {
    const data = await read("review", closedTextJob("## ✅ 발행 전 체크리스트"));

    expect(data).toEqual({ success: true, provider: "workbench · gpt-6-luna", review: "## ✅ 발행 전 체크리스트" });
  });
});
