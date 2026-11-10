import { describe, expect, it, vi } from "vitest";

import { toFeatureResult } from "@/lib/workbench-results";

const done = (overrides: Partial<{ failure: string | null; texts: unknown[]; files: string[] }> = {}) => ({
  done: true as const,
  model: "gpt-6-luna",
  failure: null,
  texts: [],
  files: [],
  ...overrides,
});
const noDownload = vi.fn();

describe("워크벤치 결과를 기존 응답 모양으로", () => {
  it("제안은 워크벤치가 파싱해 준 객체를 suggestion 으로, 리뷰는 글을 review 로 준다", async () => {
    const suggestion = { description: "요약", categories: ["Backend"], tags: ["spring"] };

    expect(await toFeatureResult("suggest", done({ texts: [suggestion] }), noDownload))
      .toEqual({ success: true, model: "workbench · gpt-6-luna", suggestion });
    expect(await toFeatureResult("review", done({ texts: ["## ✅ 발행 전 체크리스트"] }), noDownload))
      .toEqual({ success: true, provider: "workbench · gpt-6-luna", review: "## ✅ 발행 전 체크리스트" });
  });

  it("번역이 JSON 객체가 아니면 원문으로 대신하지 않고 실패로 알린다", async () => {
    expect(await toFeatureResult("translate", done({ texts: ["Here is the translation"] }), noDownload))
      .toEqual({ success: false, error: "워크벤치 응답이 JSON 객체가 아닙니다" });
  });

  it("썸네일은 결과 파일을 받아 base64 와 형식을 준다", async () => {
    const download = vi.fn().mockResolvedValue({ base64: "iVBOR", mime: "image/png" });

    const result = await toFeatureResult("thumbnail", { ...done({ files: ["sha-1"] }), model: "gpt-image-2" }, download);

    expect(download).toHaveBeenCalledWith("sha-1");
    expect(result).toEqual({ success: true, base64: "iVBOR", mime: "image/png", prompt: "", method: "workbench · gpt-image-2" });
  });

  it("작업이 실패했으면 사유를 그대로 알린다", async () => {
    expect(await toFeatureResult("review", done({ failure: "요금 한도" }), noDownload))
      .toEqual({ success: false, error: "워크벤치 작업 실패: 요금 한도" });
  });
});
