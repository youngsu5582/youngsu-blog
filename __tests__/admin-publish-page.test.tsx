import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
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
  {
    filePath: "content/posts/translated-post.mdx",
    filename: "translated-post.mdx",
    gitStatus: "modified",
    collection: "posts",
    title: "번역 있는 글",
    description: "설명",
    categories: ["Blog"],
    tags: ["admin"],
    image: "/assets/img/thumbnail/translated-post.png",
    hasEnVersion: true,
    enFilePath: "content/posts/translated-post-en.mdx",
  },
];

describe("Admin publish page", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url === "/api/admin/posts") {
          return Promise.resolve(new Response(JSON.stringify({ posts, categories: ["Blog"], tags: ["admin"] }), { status: 200 }));
        }

        if (url === "/api/admin/ai/providers") {
          return Promise.resolve(new Response(JSON.stringify({
            providers: [{ id: "test-ai", label: "테스트 AI", available: true, type: "api" }]
          }), { status: 200 }));
        }

        if (url === "/api/admin/ai/suggest" && init?.method === "POST") {
          return Promise.resolve(new Response(JSON.stringify({
            success: true,
            model: "test-ai-model",
            suggestion: {
              description: "AI 설명",
              categories: ["Blog", "AI"],
              tags: ["admin", "ai-tag"]
            }
          }), { status: 200 }));
        }

        if (url === "/api/admin/ai/review" && init?.method === "POST") {
          return Promise.resolve(new Response(JSON.stringify({
            success: true,
            provider: "test-ai",
            review: "## ✅ 발행 전 체크리스트\n- 제목/description/tags/categories 적절\n\n## ⭐ 종합 평가\n- 4/5\n- 최종 판단: 보완 후 발행"
          }), { status: 200 }));
        }

        if (url === "/api/admin/translate" && init?.method === "POST") {
          return Promise.resolve(new Response(JSON.stringify({
            success: true,
            translation: {
              title: "Translated title",
              description: "Translated description",
              categories: ["Blog"],
              tags: ["admin"],
              content: "Translated content"
            }
          }), { status: 200 }));
        }

        if (url === "/api/admin/translate/save" && init?.method === "POST") {
          return Promise.resolve(new Response(JSON.stringify({
            success: true,
            enPath: "content/posts/translated-post-en.mdx"
          }), { status: 200 }));
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

  it("AI 제안을 바로 덮어쓰지 않고 diff 확인 후 적용한다", async () => {
    render(<PublishPage />);

    fireEvent.click(await screen.findByRole("button", { name: /새 글/ }));
    fireEvent.click(screen.getByRole("button", { name: "AI 도움받기" }));

    expect(await screen.findByRole("region", { name: "AI 제안 diff" })).toBeTruthy();
    expect(screen.getByText("설명: (비어 있음) → AI 설명")).toBeTruthy();
    expect(screen.getByText("카테고리: Blog → Blog, AI")).toBeTruthy();
    expect(screen.getByText("태그: admin → admin, ai-tag")).toBeTruthy();
    expect(screen.queryByDisplayValue("AI 설명")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "제안 적용" }));

    expect(screen.getByDisplayValue("AI 설명")).toBeTruthy();
    expect(screen.getByText("ai-tag")).toBeTruthy();
  });

  it("AI 리뷰 결과를 점수와 최종 판단 요약으로 보여준다", async () => {
    render(<PublishPage />);

    fireEvent.click(await screen.findByRole("button", { name: /새 글/ }));
    fireEvent.click(screen.getByRole("button", { name: "AI 리뷰" }));

    const summary = await screen.findByRole("region", { name: "AI 리뷰 발행 판단 요약" });
    expect(summary).toBeTruthy();
    expect(within(summary).getByText("리뷰 점수 4/5")).toBeTruthy();
    expect(within(summary).getByText("최종 판단: 보완 후 발행")).toBeTruthy();
    expect(within(summary).getByText("체크리스트 포함")).toBeTruthy();
  });

  it("기존 번역본 재번역은 덮어쓰기 확인 후 overwrite 플래그를 보낸다", async () => {
    const confirm = vi.fn(() => true);
    vi.stubGlobal("confirm", confirm);

    render(<PublishPage />);

    fireEvent.click(await screen.findByRole("button", { name: /번역 있는 글/ }));
    fireEvent.click(screen.getByRole("button", { name: "재번역" }));

    await screen.findByText("번역 완료!");
    expect(confirm).toHaveBeenCalledWith("이미 영어 번역본이 있습니다. 재번역하면 기존 번역본을 덮어씁니다. 계속할까요?");
    const saveCall = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.find(([url]) => url === "/api/admin/translate/save");
    expect(JSON.parse(String(saveCall?.[1]?.body)).overwrite).toBe(true);
  });

  it("품질 보완 필요 필터로 설명/썸네일 누락 글만 볼 수 있다", async () => {
    render(<PublishPage />);

    expect(await screen.findByRole("button", { name: /새 글/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /번역 있는 글/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "품질 보완 필요 (1)" }));

    expect(screen.getByRole("button", { name: /새 글/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /번역 있는 글/ })).toBeNull();
    expect(screen.getByText("경고 2개")).toBeTruthy();
  });

  it("발행 전 dry-run 요약으로 실행 방식과 커밋 대상을 보여준다", async () => {
    render(<PublishPage />);

    fireEvent.click(await screen.findByRole("button", { name: /새 글/ }));

    expect(await screen.findByRole("region", { name: "발행 dry-run 요약" })).toBeTruthy();
    expect(screen.getByText("실행 방식: main에 직접 커밋 (푸시 없음)")).toBeTruthy();
    expect(screen.getByText("선택한 포스트 1개")).toBeTruthy();
    expect(screen.getByText("커밋 대상: content/posts/new-post.mdx")).toBeTruthy();
  });
});
