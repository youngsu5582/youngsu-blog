import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ArticleEndTracker } from "@/components/post/article-end-tracker";
import { SearchDialog } from "@/components/search/search-dialog";
import { SearchPageTracking, SearchPageResultLink } from "@/components/search/search-page-tracking";
import { CodeCopyButton } from "@/components/mdx/code-copy-button";
import { TranslationLink } from "@/components/post/translation-link";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) => open ? <div>{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/lib/content", () => ({ getAllTags: () => [] }));

const items = Array.from({ length: 25 }, (_, index) => ({
  title: `Example ${index}`, slug: `example-${index}`, description: "", tags: [], categories: [], type: "post" as const,
}));

describe("분석 이벤트", () => {
  const gtag = vi.fn();
  beforeEach(() => { vi.useFakeTimers(); window.gtag = gtag; localStorage.clear(); });
  afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); gtag.mockClear(); delete window.gtag; });

  it("검색을 멈춘 뒤 전체 결과 수와 0건을 기록하고 검색어는 보내지 않는다", () => {
    render(<SearchDialog open onOpenChange={vi.fn()} searchIndex={items} />);
    const input = screen.getByLabelText("검색");
    fireEvent.change(input, { target: { value: "Example" } });
    act(() => vi.advanceTimersByTime(500));
    expect(gtag).toHaveBeenCalledWith("event", "search_results", { result_count: 25, language: "ko", search_surface: "dialog" });
    fireEvent.change(input, { target: { value: "없는검색어" } });
    act(() => vi.advanceTimersByTime(500));
    expect(gtag).toHaveBeenLastCalledWith("event", "search_results", { result_count: 0, language: "ko", search_surface: "dialog" });
  });

  it("빠른 선택에서도 검색 결과와 선택 순위를 각각 한 번 기록한다", () => {
    const view = render(<SearchDialog open onOpenChange={vi.fn()} searchIndex={items} />);
    fireEvent.change(screen.getByLabelText("검색"), { target: { value: "Example" } });
    fireEvent.click(screen.getByRole("button", { name: /Example 0/ }));
    view.rerender(<SearchDialog open={false} onOpenChange={vi.fn()} searchIndex={items} />);
    act(() => vi.advanceTimersByTime(500));
    expect(gtag.mock.calls.filter((call) => call[1] === "search_results")).toHaveLength(1);
    expect(gtag).toHaveBeenCalledWith("event", "search_result_select", { result_type: "post", result_rank: 1, language: "ko", search_surface: "dialog" });
  });

  it("본문 끝이 보일 때 글마다 한 번 기록한다", () => {
    let callback: IntersectionObserverCallback;
    const disconnect = vi.fn();
    vi.stubGlobal("IntersectionObserver", class {
      constructor(cb: IntersectionObserverCallback) { callback = cb; }
      observe() {}
      disconnect() { disconnect(); }
    });
    const view = render(<ArticleEndTracker slug="first" contentType="post" language="ko" />);
    act(() => { callback!([{ isIntersecting: false }] as IntersectionObserverEntry[], {} as IntersectionObserver); });
    expect(gtag).not.toHaveBeenCalled();
    act(() => { callback!([{ isIntersecting: true }] as IntersectionObserverEntry[], {} as IntersectionObserver); callback!([{ isIntersecting: true }] as IntersectionObserverEntry[], {} as IntersectionObserver); });
    expect(gtag).toHaveBeenCalledTimes(1);
    view.rerender(<ArticleEndTracker slug="second" contentType="article" language="ko" />);
    act(() => { callback!([{ isIntersecting: true }] as IntersectionObserverEntry[], {} as IntersectionObserver); });
    expect(gtag).toHaveBeenLastCalledWith("event", "article_end_reached", { content_id: "second", content_type: "article", language: "ko" });
    vi.unstubAllGlobals();
  });

  it("별도 검색 페이지의 결과와 선택은 검색어 없이 기록한다", () => {
    render(<><SearchPageTracking query="개인 검색어" resultCount={42} filter="all" /><SearchPageResultLink href="/posts/example" resultType="post" rank={2}>결과</SearchPageResultLink></>);
    expect(gtag).toHaveBeenCalledWith("event", "search_results", { result_count: 42, language: "all", search_surface: "page", search_filter: "all" });
    fireEvent.click(screen.getByText("결과"));
    expect(gtag).toHaveBeenCalledWith("event", "search_result_select", { result_type: "post", result_rank: 2, language: "all", search_surface: "page" });
    expect(JSON.stringify(gtag.mock.calls)).not.toContain("개인 검색어");
  });

  it("코드 복사 성공만 코드 내용 없이 기록한다", async () => {
    window.history.replaceState({}, "", "/posts/example");
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockResolvedValue(undefined) } });
    render(<CodeCopyButton code="private code" language="typescript" />);
    await act(async () => fireEvent.click(screen.getByLabelText("코드 복사")));
    expect(gtag).toHaveBeenCalledWith("event", "code_copy", { content_id: "example", content_type: "post", code_language: "typescript" });
    expect(JSON.stringify(gtag.mock.calls)).not.toContain("private code");
    window.history.replaceState({}, "", "/");
  });

  it("번역 링크는 전후 언어와 출발 글을 기록한다", () => {
    render(<TranslationLink href="/posts/example-en" from="ko" to="en" contentId="example">번역</TranslationLink>);
    fireEvent.click(screen.getByText("번역"));
    expect(gtag).toHaveBeenCalledWith("event", "lang_change", { from_language: "ko", to_language: "en", content_id: "example", location: "translation" });
  });
});
