import { describe, expect, it } from "vitest";

import { buildSafeUploadName, validateImageUpload } from "@/lib/admin-upload-validation";

describe("admin upload validation", () => {
  it("allows only expected image mime types and size", () => {
    expect(validateImageUpload({ name: "a.png", type: "image/png", size: 1024 }).valid).toBe(true);
    expect(validateImageUpload({ name: "a.svg", type: "image/svg+xml", size: 1024 }).valid).toBe(false);
    expect(validateImageUpload({ name: "a.txt", type: "text/plain", size: 1024 }).valid).toBe(false);
    expect(validateImageUpload({ name: "huge.jpg", type: "image/jpeg", size: 11 * 1024 * 1024 }).valid).toBe(false);
  });

  it("requires the extension to match the mime type", () => {
    expect(validateImageUpload({ name: "a.jpg", type: "image/png", size: 1024 }).valid).toBe(false);
    expect(validateImageUpload({ name: "a.png", type: "image/png", size: 1024 }).valid).toBe(true);
  });

  it("normalizes uploaded names without path segments", () => {
    expect(buildSafeUploadName(1234, "../my image.PNG", "image/png")).toBe("1234-my-image.png");
    expect(buildSafeUploadName(1234, "한글 썸네일.webp", "image/webp")).toBe("1234-한글-썸네일.webp");
  });
});
