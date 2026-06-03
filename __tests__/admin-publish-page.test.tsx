import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import PublishPage from "@/app/admin/publish/page";

const posts = [
  {
    filePath: "content/posts/new-post.mdx",
    filename: "new-post.mdx",
    gitStatus: "new",
    collection: "posts",
    title: "새 글",
    description: "",
    categories: ["Blog"],
    tags: ["admin"],
    image: undefined,
    hasEnVersion: false,
  },
];

describe("Admin publish page", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);

        if (url === "/api/admin/posts") {
          return Promise.resolve(new Response(JSON.stringify({ posts, categories: ["Blog"], tags: ["admin"] }), { status: 200 }));
        }

        if (url === "/api/admin/ai/providers") {
          return Promise.resolve(new Response(JSON.stringify({ providers: [] }), { status: 200 }));
        }

        if (url === "/api/admin/thumbnail/models") {
          return Promise.resolve(new Response(JSON.stringify({ models: [] }), { status: 200 }));
        }

        return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("직접 커밋 모드에서는 main 반영 위험과 자동 푸시 위험을 계속 보여준다", async () => {
    render(<PublishPage />);

    fireEvent.click(await screen.findByRole("button", { name: /새 글/ }));

    expect(screen.getByText("위험도 높음 · main에 바로 반영")).toBeTruthy();
    expect(screen.getByText("자동 푸시는 origin/main에 즉시 반영되어 배포를 트리거할 수 있어요.")).toBeTruthy();
  });

  it("최종 확인에서 발행 방식, 자동 푸시, 미충족 품질 체크를 다시 보여준다", async () => {
    render(<PublishPage />);

    fireEvent.click(await screen.findByRole("button", { name: /새 글/ }));
    fireEvent.click(screen.getByLabelText("발행 후 자동 푸시"));
    fireEvent.click(screen.getByRole("button", { name: /발행하기/ }));

    expect(await screen.findByText("실행 예정: main에 직접 커밋 후 origin/main으로 푸시")).toBeTruthy();
    expect(screen.getByText("경고 2개: 썸네일 URL이 비어 있음, 설명(description)이 비어 있음")).toBeTruthy();
  });
});
