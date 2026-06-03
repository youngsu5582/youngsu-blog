import React, { useRef, useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MarkdownToolbar } from "@/components/admin/markdown-toolbar";

function ToolbarHarness({ initialValue = "본문" }: { initialValue?: string }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(initialValue);

  return (
    <div>
      <textarea ref={textareaRef} value={value} onChange={(e) => setValue(e.target.value)} />
      <MarkdownToolbar textareaRef={textareaRef} value={value} onChange={setValue} />
    </div>
  );
}

describe("MarkdownToolbar", () => {
  it("editor toolbar를 의미 있는 그룹과 한국어 aria-label로 보여준다", () => {
    render(<ToolbarHarness />);

    expect(screen.getByRole("toolbar", { name: "마크다운 편집 도구" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "텍스트 서식" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "삽입" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "굵게" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "링크 삽입" })).toBeTruthy();
    expect(screen.getByText("단축키: Cmd/Ctrl+B · Cmd/Ctrl+K")).toBeTruthy();
  });

  it("버튼 type이 submit이 아니어서 에디터 폼 저장을 실수로 트리거하지 않는다", () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());

    render(
      <form onSubmit={onSubmit}>
        <ToolbarHarness />
        <button type="submit">저장</button>
      </form>
    );

    fireEvent.click(screen.getByRole("button", { name: "굵게" }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
