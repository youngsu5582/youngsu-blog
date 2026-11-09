import { describe, expect, it, vi } from "vitest";

import { readAiResult } from "@/lib/admin-ai-client";

const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });
const instant = () => Promise.resolve();

describe("readAiResult", () => {
  it("기존 프로바이더의 응답은 그대로 돌려준다", async () => {
    const fetcher = vi.fn();

    const data = await readAiResult(json({ success: true, review: "리뷰" }), { fetcher, sleep: instant });

    expect(data).toEqual({ success: true, review: "리뷰" });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("워크벤치 작업은 끝날 때까지 묻고, 접수 응답의 나머지와 결과를 합친다", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(json({ pending: true, status: "DISPATCHED" }))
      .mockResolvedValueOnce(json({ success: true, translation: { title: "Title" } }));

    const data = await readAiResult(
      json({ success: true, originalContent: "원문", workbench: { jobUuid: "job-1", feature: "translate" } }),
      { fetcher, sleep: instant }
    );

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher).toHaveBeenCalledWith("/api/admin/workbench/jobs/job-1?feature=translate");
    expect(data).toEqual({ success: true, originalContent: "원문", translation: { title: "Title" } });
  });

  it("정한 시간 안에 끝나지 않으면 작업 uuid 와 함께 실패로 알린다", async () => {
    const fetcher = vi.fn().mockImplementation(() => Promise.resolve(json({ pending: true, status: "DISPATCHED" })));

    const data = await readAiResult(json({ success: true, workbench: { jobUuid: "job-1", feature: "thumbnail" } }), {
      fetcher,
      sleep: () => new Promise((resolve) => setTimeout(resolve, 5)),
      intervalMs: 5,
      timeoutMs: 20,
    });

    expect(data.success).toBe(false);
    expect(data.error).toContain("job-1");
  });
});
