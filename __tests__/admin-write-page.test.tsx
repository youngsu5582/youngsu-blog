import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("저장된 임시글은 자동으로 덮어쓰지 않고 배너에서 복원하도록 한다", async () => {
    localStorage.setItem("admin-write-drafts", JSON.stringify([
      {
        id: "draft-1",
        title: "복원할 제목",
        slug: "restore-me",
        slugManual: true,
        description: "복원 설명",
        collection: "posts",
        categories: ["Blog"],
        tags: ["draft"],
        thumbnail: "",
        relatedSlugs: [],
        content: "복원할 본문",
        savedAt: "2026-01-01T00:00:00.000Z"
      }
    ]));

    render(<WritePage />);

    expect(screen.queryByDisplayValue("복원할 본문")).toBeNull();
    expect(await screen.findByRole("region", { name: "임시글 복원 안내" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "임시글 복원" }));

    await waitFor(() => expect(screen.getByDisplayValue("복원할 본문")).toBeTruthy());
  });

  it("작성 중 템플릿 적용은 diff 확인 후에만 현재 글을 덮어쓴다", async () => {
    render(<WritePage />);

    fireEvent.change(screen.getByPlaceholderText(/마크다운으로 작성하세요/), { target: { value: "기존 본문" } });
    fireEvent.click(screen.getAllByRole("button", { name: "펼치기" }).at(-1)!);
    fireEvent.click(screen.getByRole("button", { name: /학습 노트/ }));

    expect(await screen.findByRole("region", { name: "템플릿 적용 diff" })).toBeTruthy();
    expect(screen.getByText("컬렉션: posts → notes")).toBeTruthy();
    expect(screen.getByText("카테고리: (비어 있음) → 학습")).toBeTruthy();
    expect(screen.getByText(/본문: 기존 본문 → ## 주제/)).toBeTruthy();
    expect(screen.getByDisplayValue("기존 본문")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "템플릿 적용" }));

    await waitFor(() => expect(screen.getByDisplayValue(/## 주제/)).toBeTruthy());
    expect(screen.queryByRole("region", { name: "템플릿 적용 diff" })).toBeNull();
  });

  it("긴 글 아웃라인에서 제목을 검색하고 해당 위치로 이동할 수 있다", async () => {
    render(<WritePage />);

    const editor = screen.getByPlaceholderText(/마크다운으로 작성하세요/) as HTMLTextAreaElement;
    fireEvent.change(editor, { target: { value: "## 시작\n본문\n### 구현\n내용\n## 마무리" } });

    expect(await screen.findByRole("region", { name: "긴 글 아웃라인" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "시작" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "구현" })).toBeTruthy();

    fireEvent.change(screen.getByLabelText("아웃라인 검색"), { target: { value: "마무" } });
    expect(screen.queryByRole("button", { name: "시작" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "마무리" }));

    expect(editor.selectionStart).toBe("## 시작\n본문\n### 구현\n내용\n".length);
  });

  it("본문에서 선택한 여러 줄을 Shift+Tab으로 한 단계 내어쓸 수 있다", () => {
    render(<WritePage />);

    const editor = screen.getByPlaceholderText(/마크다운으로 작성하세요/) as HTMLTextAreaElement;
    const value = "```yml\n  services:\n    cloudflared:\n      image: cloudflare/cloudflared:latest\n```";
    fireEvent.change(editor, { target: { value } });

    const start = value.indexOf("  services:");
    const end = value.indexOf("```", start) - 1;
    editor.setSelectionRange(start, end);
    fireEvent.keyDown(editor, { key: "Tab", shiftKey: true });

    expect(editor.value).toBe("```yml\nservices:\n  cloudflared:\n    image: cloudflare/cloudflared:latest\n```");
  });

});
