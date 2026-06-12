import { describe, expect, it } from "vitest";

import { buildAiReviewPrompt } from "@/lib/admin-ai-review-prompt";

describe("buildAiReviewPrompt", () => {
  it("발행 전 체크리스트, 사용자 말투, 민감정보 검수를 포함한다", () => {
    const prompt = buildAiReviewPrompt(
      { title: "홈서버 운영기", description: "장애를 고친 기록", categories: ["homelab"], tags: ["docker"] },
      "본문입니다"
    );

    expect(prompt).toContain("발행 전 체크리스트");
    expect(prompt).toContain("내 말투");
    expect(prompt).toContain("민감정보");
    expect(prompt).toContain("회사정보");
    expect(prompt).toContain("draft: false");
    expect(prompt).toContain("tags");
  });
});
