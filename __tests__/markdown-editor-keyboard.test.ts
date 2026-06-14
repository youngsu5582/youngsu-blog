import { describe, expect, it } from "vitest";

import { applyMarkdownIndent } from "@/components/admin/markdown-editor-keyboard";

describe("markdown editor keyboard indentation", () => {
  it("Shift+Tab removes one indentation level from every selected line and preserves the selection", () => {
    const value =
      "```yml\n  services:\n    cloudflared:\n      image: cloudflare/cloudflared:latest\n```";
    const start = value.indexOf("  services:");
    const end = value.indexOf("```", start) - 1;

    const result = applyMarkdownIndent(value, start, end, "outdent");

    expect(result.value).toBe(
      "```yml\nservices:\n  cloudflared:\n    image: cloudflare/cloudflared:latest\n```",
    );
    expect(result.selectionStart).toBe(start);
    expect(result.selectionEnd).toBe(end - 6);
  });

  it("Tab adds two spaces to every selected line and preserves the selected block", () => {
    const value = "services:\n  cloudflared:\n    image: cloudflare/cloudflared:latest";
    const result = applyMarkdownIndent(value, 0, value.length, "indent");

    expect(result.value).toBe(
      "  services:\n    cloudflared:\n      image: cloudflare/cloudflared:latest",
    );
    expect(result.selectionStart).toBe(0);
    expect(result.selectionEnd).toBe(value.length + 6);
  });

  it("Shift+Tab outdents only the current line when there is no selection", () => {
    const value = "services:\n    cloudflared:";
    const cursor = value.indexOf("cloudflared");

    const result = applyMarkdownIndent(value, cursor, cursor, "outdent");

    expect(result.value).toBe("services:\n  cloudflared:");
    expect(result.selectionStart).toBe(cursor - 2);
    expect(result.selectionEnd).toBe(cursor - 2);
  });
});
