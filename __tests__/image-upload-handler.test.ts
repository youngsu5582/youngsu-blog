import { afterEach, describe, expect, it, vi } from "vitest";

import { handlePaste, type ImageUploadOptions } from "@/components/admin/image-upload-handler";

describe("image upload handler", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("paste upload이 완료되면 React state callback에 Markdown을 전달한다", async () => {
    const file = new File(["png"], "image.png", { type: "image/png" });
    const onContentChange = vi.fn();
    const options = {
      onContentChange,
    } as ImageUploadOptions & { onContentChange: (value: string) => void };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          files: [{ path: "https://assets.example.test/blog/image.png" }],
        }),
      })
    );

    const textarea = document.createElement("textarea");
    textarea.value = "본문";
    textarea.setSelectionRange(2, 2);
    const preventDefault = vi.fn();
    const event = {
      clipboardData: {
        items: [{ type: "image/png", getAsFile: () => file }],
      },
      preventDefault,
    } as unknown as ClipboardEvent;

    handlePaste(event, textarea, options);
    await vi.waitFor(() => {
      expect(onContentChange).toHaveBeenCalledWith(
        "본문![image](https://assets.example.test/blog/image.png)"
      );
    });
    expect(preventDefault).toHaveBeenCalled();
  });
});
