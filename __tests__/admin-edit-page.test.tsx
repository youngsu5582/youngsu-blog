import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import EditPage from "@/app/admin/edit/page";

const items = [
  {
    slug: "long-post",
    title: "긴 글 테스트",
    collection: "posts",
    date: "2026-01-01",
  },
];

const content = {
  frontmatter: {
    title: "긴 글 테스트",
    description: "긴 글 편집 UX 확인",
    categories: ["Blog"],
    tags: ["admin"],
    date: "2026-01-01",
  },
  body: "## 시작\n\n본문".repeat(20),
};

describe("Admin edit page", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url === "/api/admin/content") {
          return Promise.resolve(new Response(JSON.stringify({ items }), { status: 200 }));
        }

        if (url === "/api/admin/content?file=_taxonomies") {
          return Promise.resolve(new Response(JSON.stringify({ categories: ["Blog"], tags: ["admin"] }), { status: 200 }));
        }

        if (url.startsWith("/api/admin/edit?") && !init) {
          return Promise.resolve(new Response(JSON.stringify(content), { status: 200 }));
        }

        if (url === "/api/admin/edit" && init?.method === "POST") {
          return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
        }

        return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("긴 글 편집 중에도 상단 작업 바에서 저장과 미리보기를 바로 조작할 수 있다", async () => {
    render(<EditPage />);

    fireEvent.click(await screen.findByRole("button", { name: /긴 글 테스트/ }));

    const actionBar = await screen.findByRole("region", { name: "편집 작업 바" });
    expect(actionBar).toBeTruthy();
    expect(screen.getByText("편집 중: 긴 글 테스트")).toBeTruthy();
    expect(screen.getByRole("button", { name: "상단에서 저장하기" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "미리보기 숨기기" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "상단에서 저장하기" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/admin/edit",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  it("본문 편집기와 미리보기는 viewport 기준 높이 컨테이너 안에서 스크롤된다", async () => {
    render(<EditPage />);

    fireEvent.click(await screen.findByRole("button", { name: /긴 글 테스트/ }));

    const editorRegion = await screen.findByRole("region", { name: "마크다운 본문 편집" });
    const previewRegion = screen.getByRole("region", { name: "마크다운 미리보기" });

    expect(editorRegion.className).toContain("max-h-[calc(100vh-20rem)]");
    expect(previewRegion.className).toContain("max-h-[calc(100vh-20rem)]");
    expect(screen.getByPlaceholderText("마크다운으로 작성하세요...").className).toContain("overflow-y-auto");
  });
});
