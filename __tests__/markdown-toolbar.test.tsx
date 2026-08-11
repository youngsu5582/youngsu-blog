import React, { useRef, useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MarkdownToolbar } from "@/components/admin/markdown-toolbar";

function ToolbarHarness({
  initialValue = "본문",
  onImageUpload,
}: {
  initialValue?: string;
  onImageUpload?: (file: File) => Promise<string>;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(initialValue);

  return (
    <div>
      <textarea ref={textareaRef} value={value} onChange={(e) => setValue(e.target.value)} />
      <MarkdownToolbar
        textareaRef={textareaRef}
        value={value}
        onChange={setValue}
        onImageUpload={onImageUpload}
      />
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

  it("이미지 버튼으로 선택한 파일을 업로드하고 커서 위치에 Markdown을 삽입한다", async () => {
    const onImageUpload = vi.fn().mockResolvedValue("https://assets.example.test/blog/diagram.png");

    render(<ToolbarHarness onImageUpload={onImageUpload} />);

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    textarea.focus();
    textarea.setSelectionRange(2, 2);

    fireEvent.click(screen.getByRole("button", { name: "이미지 삽입" }));
    const file = new File(["png"], "diagram.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("이미지 파일 업로드"), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(textarea.value).toBe("본문![diagram](https://assets.example.test/blog/diagram.png)");
    });
    expect(onImageUpload).toHaveBeenCalledWith(file);
  });
});
