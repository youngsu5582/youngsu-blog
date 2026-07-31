import { afterEach, describe, expect, it, vi } from "vitest";

import { handlePaste } from "@/components/admin/image-upload-handler";

describe("image upload handler", () => {
  afterEach(() => vi.restoreAllMocks());

  it("replaces only its own placeholder and preserves edits made during upload", async () => {
    let resolveUpload!: (response: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveUpload = resolve;
          }),
      ),
    );

    const textarea = document.createElement("textarea");
    textarea.value = "앞 문장";
    document.body.appendChild(textarea);
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);

    const item = {
      type: "image/png",
      getAsFile: () =>
        new File([new Uint8Array([137, 80, 78, 71])], "capture.png", { type: "image/png" }),
    } as unknown as DataTransferItem;
    const event = new Event("paste", { bubbles: true, cancelable: true }) as ClipboardEvent;
    Object.defineProperty(event, "clipboardData", { value: { items: [item] } });

    handlePaste(event, textarea);
    expect(event.defaultPrevented).toBe(true);
    expect(textarea.value).toContain("이미지 업로드 중");

    textarea.value += "\n사용자가 업로드 중 추가한 문장";
    resolveUpload(
      new Response(
        JSON.stringify({
          success: true,
          files: [{ path: "https://img.example.com/capture.webp" }],
        }),
        { status: 200 },
      ),
    );
    await vi.waitFor(() =>
      expect(textarea.value).toContain("https://img.example.com/capture.webp"),
    );

    expect(textarea.value).toContain("앞 문장");
    expect(textarea.value).toContain("사용자가 업로드 중 추가한 문장");
    expect(textarea.value).not.toContain("이미지 업로드 중");
  });

  it("does not intercept normal text paste", () => {
    const textarea = document.createElement("textarea");
    const event = new Event("paste", { bubbles: true, cancelable: true }) as ClipboardEvent;
    Object.defineProperty(event, "clipboardData", { value: { items: [{ type: "text/plain" }] } });

    handlePaste(event, textarea);

    expect(event.defaultPrevented).toBe(false);
  });
});
