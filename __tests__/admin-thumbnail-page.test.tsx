import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ThumbnailPage from "@/app/admin/thumbnail/page";

describe("Admin thumbnail page", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url === "/api/admin/content?file=_posts") {
          return Promise.resolve(new Response(JSON.stringify({
            posts: [
              {
                filePath: "content/posts/test-post.mdx",
                filename: "test-post",
                title: "테스트 포스트",
                categories: ["Blog"],
                tags: ["admin"]
              }
            ]
          }), { status: 200 }));
        }
        if (url === "/api/admin/thumbnail/models") {
          return Promise.resolve(new Response(JSON.stringify({
            models: [{ id: "test-model", displayName: "테스트 모델", description: "빠른 테스트 모델" }]
          }), { status: 200 }));
        }
        if (url === "/api/admin/thumbnail" && init?.method === "POST") {
          return Promise.resolve(new Response(JSON.stringify({
            success: true,
            base64: "iVBORw0KGgo=",
            prompt: "테스트 프롬프트",
            method: "test-model"
          }), { status: 200 }));
        }
        if (url === "/api/admin/thumbnail/save" && init?.method === "POST") {
          return Promise.resolve(new Response(JSON.stringify({
            success: true,
            filePath: "/assets/img/thumbnail/test-post.png",
            frontmatterUpdated: true
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

  it("썸네일 생성 전/후 상태와 미리보기, 저장 결과를 명확히 보여준다", async () => {
    render(<ThumbnailPage />);

    expect(await screen.findByRole("region", { name: "썸네일 상태" })).toBeTruthy();
    expect(screen.getByText(/아직 생성된 썸네일이 없어요/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /포스트를 선택하세요/ }));
    fireEvent.click(await screen.findByRole("button", { name: "테스트 포스트" }));
    fireEvent.click(screen.getByRole("button", { name: "생성하기" }));

    expect(await screen.findByRole("img", { name: "생성된 썸네일 미리보기" })).toBeTruthy();
    expect(screen.getByText("저장 대기" )).toBeTruthy();
    expect(screen.getByText("frontmatter 업데이트 예정: content/posts/test-post.mdx")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "저장하기" }));

    await waitFor(() => expect(screen.getByText("저장 완료" )).toBeTruthy());
    expect(screen.getByText("/assets/img/thumbnail/test-post.png")).toBeTruthy();
    expect(screen.getByText("frontmatter 업데이트 완료")).toBeTruthy();
  });
});
