import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  isWorkbenchConfigured,
  readWorkbenchJob,
  resetWorkbenchTemplateCache,
  submitWorkbenchTemplate,
} from "@/lib/workbench";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("워크벤치 클라이언트", () => {
  beforeEach(() => {
    vi.stubEnv("WORKBENCH_BASE_URL", "https://workbench.test/");
    vi.stubEnv("WORKBENCH_API_KEY", "pawb_test");
    resetWorkbenchTemplateCache();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("주소와 키가 없으면 설정되지 않은 것으로 보고 부르지 않는다", async () => {
    vi.stubEnv("WORKBENCH_API_KEY", "");
    const fetcher = vi.spyOn(globalThis, "fetch");

    expect(isWorkbenchConfigured()).toBe(false);
    await expect(submitWorkbenchTemplate("블로그 · 썸네일", {})).rejects.toThrow("WORKBENCH_API_KEY");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("템플릿을 이름으로 찾아 서비스 키로 변수만 보내고 작업 uuid 를 돌려준다", async () => {
    const fetcher = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(json([{ uuid: "t-1", name: "블로그 · 메타데이터 제안" }]))
      .mockResolvedValueOnce(json({ uuid: "job-1" }, 202));

    const job = await submitWorkbenchTemplate("블로그 · 메타데이터 제안", { title: "제목" });

    expect(job).toBe("job-1");
    expect(fetcher.mock.calls[0][0]).toBe("https://workbench.test/api/templates");
    const [url, init] = fetcher.mock.calls[1];
    expect(url).toBe("https://workbench.test/api/templates/t-1/jobs");
    expect(init?.method).toBe("POST");
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer pawb_test");
    expect(JSON.parse(String(init?.body))).toEqual({ variables: { title: "제목" } });
  });

  it("템플릿이 없으면 sync 를 하라고 알린다", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(json([]));

    await expect(submitWorkbenchTemplate("블로그 · 썸네일", {})).rejects.toThrow("pnpm workbench:sync");
  });

  it("오류 응답은 상태 코드와 detail 만 알린다", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(json([{ uuid: "t-1", name: "블로그 · 썸네일" }]))
      .mockResolvedValueOnce(json({ title: "Bad Request", detail: "변수가 맞지 않는다: title" }, 400));

    await expect(submitWorkbenchTemplate("블로그 · 썸네일", {})).rejects.toThrow("워크벤치 400: 변수가 맞지 않는다: title");
  });

  it("끝나기 전과 실패 · 성공을 가른다", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(json({ status: "DISPATCHED", model: "gpt-6-luna", tasks: [] }))
      .mockResolvedValueOnce(json({ status: "CLOSED", model: "gpt-6-luna", tasks: [{ status: "FAILED", failureReason: "요금 한도" }] }))
      .mockResolvedValueOnce(json({
        status: "CLOSED",
        model: "gpt-image-2",
        tasks: [{ status: "SUCCEEDED", texts: [{ content: "글" }, { content: { title: "Title" } }], files: [{ sha256: "abc" }] }],
      }));

    expect(await readWorkbenchJob("j")).toEqual({ done: false, status: "DISPATCHED" });
    expect(await readWorkbenchJob("j")).toMatchObject({ done: true, failure: "요금 한도" });
    expect(await readWorkbenchJob("j")).toEqual({ done: true, model: "gpt-image-2", failure: null, texts: ["글", { title: "Title" }], files: ["abc"] });
  });
});
