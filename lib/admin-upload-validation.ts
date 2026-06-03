import path from "path";

export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;

const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export function validateImageUpload(file: { name: string; type: string; size: number }): { valid: boolean; error?: string } {
  const expectedExtension = MIME_TO_EXTENSION[file.type];
  if (!expectedExtension) return { valid: false, error: "지원하지 않는 이미지 형식입니다" };
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) return { valid: false, error: "이미지는 10MB 이하만 업로드할 수 있습니다" };

  const ext = path.extname(file.name).toLowerCase();
  const allowedExtensions = file.type === "image/jpeg" ? [".jpg", ".jpeg"] : [expectedExtension];
  if (!allowedExtensions.includes(ext)) return { valid: false, error: "이미지 확장자와 MIME 타입이 일치하지 않습니다" };

  return { valid: true };
}

export function buildSafeUploadName(timestamp: number, originalName: string, mimeType: string): string {
  const originalExt = path.extname(originalName).toLowerCase();
  const ext = mimeType === "image/jpeg" && originalExt === ".jpeg" ? ".jpeg" : MIME_TO_EXTENSION[mimeType];
  const basename = path.basename(originalName, path.extname(originalName));
  const safeBasename = basename
    .replace(/[^a-zA-Z0-9가-힣-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "image";

  return `${timestamp}-${safeBasename}${ext}`;
}
