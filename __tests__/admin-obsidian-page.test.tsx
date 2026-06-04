import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ObsidianPage from "@/app/admin/obsidian/page";

describe("Admin obsidian page", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("alert", vi.fn());
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url.startsWith("/api/admin/obsidian") && init?.method !== "POST") {
          return Promise.resolve(new Response(JSON.stringify({
            success: true,
            vaultPath: "/home/yeongsu/obsidian",
            files: [{ filename: "글감.md", path: "/home/yeongsu/obsidian/글감.md", size: 1234, modifiedAt: "2026-06-04T00:00:00.000Z" }]
          }), { status: 200 }));
        }

        if (url === "/api/admin/obsidian" && init?.method === "POST") {
          return Promise.resolve(new Response(JSON.stringify({
            success: true,
            summary: { total: 1, success: 1, failed: 0 },
            results: [{ file: "/home/yeongsu/obsidian/글감.md", success: true, outputPath: "content/posts/idea.mdx" }]
          }), { status: 200 }));
        }

        return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("Obsidian 글감을 초안으로 가져온 뒤 편집 링크와 다음 단계 안내를 보여준다", async () => {
    render(<ObsidianPage />);

    fireEvent.change(screen.getByPlaceholderText("/Users/username/Documents/ObsidianVault"), { target: { value: "/home/yeongsu/obsidian" } });
    fireEvent.click(screen.getByRole("button", { name: "불러오기" }));

    fireEvent.click(await screen.findByText("글감.md"));
    fireEvent.click(screen.getByRole("button", { name: /가져오기/ }));

    expect(await screen.findByText("초안으로 생성됨")).toBeTruthy();
    expect(screen.getByText("content/posts/idea.mdx")).toBeTruthy();
    expect(screen.getByRole("link", { name: "편집에서 열기" }).getAttribute("href")).toBe("/admin/edit?file=content%2Fposts%2Fidea.mdx");
    expect(screen.getByText("다음 단계: 편집에서 태그/카테고리와 AI 리뷰를 확인한 뒤 발행하세요.")).toBeTruthy();
  });
});
