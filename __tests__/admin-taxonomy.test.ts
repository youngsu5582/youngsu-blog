import { describe, expect, it } from "vitest";

import {
  buildTaxonomySummary,
  renameTaxonomyValues,
  normalizeTaxonomyValue,
} from "@/lib/admin-taxonomy";

describe("admin taxonomy helpers", () => {
  it("태그 사용 횟수와 파일 목록을 모아 보여준다", () => {
    const summary = buildTaxonomySummary([
      { repoPath: "content/posts/a.mdx", title: "A", tags: ["homelab", "docker"], categories: ["infra"] },
      { repoPath: "content/notes/b.mdx", title: "B", tags: ["homelab"], categories: ["til"] },
    ], "tags");

    expect(summary).toEqual([
      {
        value: "homelab",
        count: 2,
        files: [
          { repoPath: "content/posts/a.mdx", title: "A" },
          { repoPath: "content/notes/b.mdx", title: "B" },
        ],
      },
      {
        value: "docker",
        count: 1,
        files: [{ repoPath: "content/posts/a.mdx", title: "A" }],
      },
    ]);
  });

  it("태그 rename/merge 시 순서를 유지하고 중복을 제거한다", () => {
    expect(renameTaxonomyValues(["homelab", "docker", "home-lab"], "home-lab", "homelab")).toEqual([
      "homelab",
      "docker",
    ]);
  });

  it("태그 값은 앞뒤 공백과 연속 공백만 정리하고 사용자가 입력한 대소문자는 보존한다", () => {
    expect(normalizeTaxonomyValue("  AI   Review  ")).toBe("AI Review");
  });
});
