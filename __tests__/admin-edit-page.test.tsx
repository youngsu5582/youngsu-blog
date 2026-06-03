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
  {
    slug: "second-post",
    title: "두 번째 글",
    collection: "posts",
    date: "2026-01-02",
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
  body: "## 시작\n\n본문\n\n### 구현\n\n내용\n\n## 마무리",
};

describe("Admin edit page", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("confirm", vi.fn(() => true));
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

  it("긴 글 아웃라인에서 제목을 검색하고 본문 위치로 이동할 수 있다", async () => {
    render(<EditPage />);

    fireEvent.click(await screen.findByRole("button", { name: /긴 글 테스트/ }));
    const editor = await screen.findByPlaceholderText("마크다운으로 작성하세요...") as HTMLTextAreaElement;

    expect(await screen.findByRole("region", { name: "긴 글 아웃라인" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "시작" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "구현" })).toBeTruthy();

    fireEvent.change(screen.getByLabelText("아웃라인 검색"), { target: { value: "마무" } });
    expect(screen.queryByRole("button", { name: "시작" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "마무리" }));

    expect(editor.selectionStart).toBe("## 시작\n\n본문\n\n### 구현\n\n내용\n\n".length);
  });

  it("자동저장 초안은 원본을 바로 덮어쓰지 않고 배너에서 선택 복원한다", async () => {
    localStorage.setItem("admin-edit-draft-posts-long-post", JSON.stringify({
      frontmatter: { ...content.frontmatter, title: "자동저장 제목" },
      body: "자동저장 본문",
      editSlug: "auto-saved-slug",
      savedAt: "2026-12-31T00:00:00.000Z",
    }));

    render(<EditPage />);

    fireEvent.click(await screen.findByRole("button", { name: /긴 글 테스트/ }));

    expect(await screen.findByRole("region", { name: "편집 자동저장 복원 안내" })).toBeTruthy();
    expect(screen.getByText(/자동저장 초안/)).toBeTruthy();
    expect(screen.queryByDisplayValue("자동저장 본문")).toBeNull();
    await waitFor(() => expect(screen.getByPlaceholderText("마크다운으로 작성하세요...")).toHaveProperty("value", content.body));

    fireEvent.click(screen.getByRole("button", { name: "자동저장 복원" }));

    await waitFor(() => expect(screen.getByPlaceholderText("마크다운으로 작성하세요...")).toHaveProperty("value", "자동저장 본문"));
    expect(screen.getByDisplayValue("자동저장 제목")).toBeTruthy();
    expect(screen.getByDisplayValue("auto-saved-slug")).toBeTruthy();
  });

  it("본문 편집 중 Ctrl+S로 즉시 저장할 수 있다", async () => {
    render(<EditPage />);

    fireEvent.click(await screen.findByRole("button", { name: /긴 글 테스트/ }));
    const editor = await screen.findByPlaceholderText("마크다운으로 작성하세요...");

    expect(screen.getByText("Ctrl/⌘+S 저장")).toBeTruthy();
    fireEvent.keyDown(editor, { key: "s", ctrlKey: true });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/admin/edit",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  it("미저장 변경이 있으면 목록으로 돌아가기 전에 확인한다", async () => {
    const confirm = vi.fn(() => false);
    vi.stubGlobal("confirm", confirm);

    render(<EditPage />);

    fireEvent.click(await screen.findByRole("button", { name: /긴 글 테스트/ }));
    const editor = await screen.findByPlaceholderText("마크다운으로 작성하세요...");
    fireEvent.change(editor, { target: { value: "수정한 본문" } });

    fireEvent.click(screen.getByRole("button", { name: "목록으로" }));

    expect(confirm).toHaveBeenCalledWith("저장되지 않은 변경사항이 있습니다. 계속 이동할까요?");
    expect(screen.getByRole("region", { name: "편집 작업 바" })).toBeTruthy();
  });

  it("목록에서 자동저장 초안이 있는 글을 빠르게 필터링하고 표시한다", async () => {
    localStorage.setItem("admin-edit-draft-posts-second-post", JSON.stringify({
      frontmatter: { title: "두 번째 자동저장" },
      body: "초안 본문",
      editSlug: "second-post",
      savedAt: "2026-12-31T00:00:00.000Z",
    }));

    render(<EditPage />);

    expect(await screen.findByRole("button", { name: /두 번째 글/ })).toBeTruthy();
    expect(screen.getByText("임시저장")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "임시저장 있음 (1)" }));

    expect(screen.getByRole("button", { name: /두 번째 글/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /긴 글 테스트/ })).toBeNull();
  });

  it("미저장 변경이 있으면 다른 글 선택을 취소할 수 있다", async () => {
    const confirm = vi.fn(() => false);
    vi.stubGlobal("confirm", confirm);

    render(<EditPage />);

    fireEvent.click(await screen.findByRole("button", { name: /긴 글 테스트/ }));
    const editor = await screen.findByPlaceholderText("마크다운으로 작성하세요...");
    fireEvent.change(editor, { target: { value: "수정한 본문" } });

    fireEvent.click(screen.getByRole("button", { name: /두 번째 글/ }));

    expect(confirm).toHaveBeenCalledWith("저장되지 않은 변경사항이 있습니다. 계속 이동할까요?");
    expect(screen.getByText("편집 중: 긴 글 테스트")).toBeTruthy();
  });
});
