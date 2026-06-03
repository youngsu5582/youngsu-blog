import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import WritePage from "@/app/admin/write/page";

describe("Admin write page", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("confirm", vi.fn(() => true));
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url === "/api/admin/content?file=_taxonomies") {
          return Promise.resolve(new Response(JSON.stringify({ categories: ["Blog"], tags: ["admin"] }), { status: 200 }));
        }
        if (url === "/api/admin/content") {
          return Promise.resolve(new Response(JSON.stringify({ items: [] }), { status: 200 }));
        }
        if (url === "/api/admin/write") {
          return Promise.resolve(new Response(JSON.stringify({ success: true, filePath: "content/posts/test.mdx" }), { status: 200 }));
        }
        return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("새 글을 누를 때 작성 중인 내용이 있으면 초기화 전에 확인한다", () => {
    const confirm = vi.fn(() => false);
    vi.stubGlobal("confirm", confirm);

    render(<WritePage />);

    fireEvent.change(screen.getByPlaceholderText(/마크다운으로 작성하세요/), { target: { value: "작성 중인 본문" } });
    fireEvent.click(screen.getByRole("button", { name: "새 글" }));

    expect(confirm).toHaveBeenCalledWith("작성 중인 내용이 있습니다. 새 글로 초기화할까요?");
    expect(screen.getByDisplayValue("작성 중인 본문")).toBeTruthy();
  });

  it("위험한 slug를 실시간으로 안내하고 저장을 막는다", () => {
    render(<WritePage />);

    fireEvent.click(screen.getByRole("button", { name: /메타데이터 펼치기/ }));
    fireEvent.change(screen.getByPlaceholderText("한글 제목 가능"), { target: { value: "테스트 제목" } });
    fireEvent.change(screen.getByPlaceholderText("영문-kebab-case (자동 생성)"), { target: { value: "bad/slug" } });

    expect(screen.getByText("Slug는 한글/영문 소문자/숫자/하이픈만 사용할 수 있고, / 또는 ..은 사용할 수 없어요.")).toBeTruthy();
    expect((screen.getByRole("button", { name: "저장하기" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
