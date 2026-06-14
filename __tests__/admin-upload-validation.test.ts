import fs from "fs";
import { describe, expect, it } from "vitest";

import { buildSafeUploadName, validateImageBuffer, validateImageUpload } from "@/lib/admin-upload-validation";

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

  it("validates image magic bytes against declared mime type", () => {
    expect(validateImageBuffer(Buffer.from([0x89, 0x50, 0x4e, 0x47]), "image/png").valid).toBe(true);
    expect(validateImageBuffer(Buffer.from([0xff, 0xd8, 0xff, 0xe0]), "image/jpeg").valid).toBe(true);
    expect(validateImageBuffer(Buffer.from("not an image"), "image/png").valid).toBe(false);
    expect(validateImageBuffer(Buffer.from([0x89, 0x50, 0x4e, 0x47]), "image/jpeg").valid).toBe(false);
  });

  it("normalizes uploaded names without path segments", () => {
    expect(buildSafeUploadName(1234, "../my image.PNG", "image/png")).toBe("1234-my-image.png");
    expect(buildSafeUploadName(1234, "한글 썸네일.webp", "image/webp")).toBe("1234-한글-썸네일.webp");
  });
});

describe("admin upload and thumbnail route safety", () => {
  const uploadRoute = fs.readFileSync("app/api/admin/upload/route.ts", "utf-8");
  const thumbnailSaveRoute = fs.readFileSync("app/api/admin/thumbnail/save/route.ts", "utf-8");

  it("upload route reports rejected files instead of silently skipping invalid uploads", () => {
    expect(uploadRoute).toContain("rejectedFiles");
    expect(uploadRoute).toContain("validateImageBuffer");
    expect(uploadRoute).not.toContain("continue; // Skip invalid/non-image files");
  });

  it("upload route delegates persistence to storage helper so S3/R2 can be configured server-side", () => {
    expect(uploadRoute).toContain("uploadAdminImage");
    expect(uploadRoute).not.toContain("fs.writeFileSync");
    expect(uploadRoute).not.toContain("const UPLOAD_DIR");
  });

  it("thumbnail save route validates filename, base64 image bytes, and originalPath", () => {
    expect(thumbnailSaveRoute).toContain("validateThumbnailFilename");
    expect(thumbnailSaveRoute).toContain("validateImageBuffer");
    expect(thumbnailSaveRoute).toContain("resolveRepoFilePath");
    expect(thumbnailSaveRoute).toContain("ALLOWED_THUMBNAIL_CONTENT_PREFIXES");
    expect(thumbnailSaveRoute).not.toContain("originalPath.startsWith");
    expect(thumbnailSaveRoute).not.toContain("path.join(process.cwd(), originalPath)");
  });
});
