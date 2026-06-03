import path from "path";

export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;

const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export function detectImageMimeFromBuffer(buffer: Buffer): string | null {
  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return "image/png";
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString("ascii") === "GIF8") return "image/gif";
  return null;
}

export function extensionForMime(mimeType: string): string | null {
  return MIME_TO_EXTENSION[mimeType] || null;
}

export function validateImageUpload(file: { name: string; type: string; size: number }): { valid: boolean; error?: string } {
  const expectedExtension = MIME_TO_EXTENSION[file.type];
  if (!expectedExtension) return { valid: false, error: "지원하지 않는 이미지 형식입니다" };
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) return { valid: false, error: "이미지는 10MB 이하만 업로드할 수 있습니다" };

  const ext = path.extname(file.name).toLowerCase();
  const allowedExtensions = file.type === "image/jpeg" ? [".jpg", ".jpeg"] : [expectedExtension];
  if (!allowedExtensions.includes(ext)) return { valid: false, error: "이미지 확장자와 MIME 타입이 일치하지 않습니다" };

  return { valid: true };
}

export function validateImageBuffer(buffer: Buffer, declaredMimeType: string): { valid: boolean; error?: string; detectedMimeType?: string } {
  if (buffer.length === 0) return { valid: false, error: "빈 이미지 파일입니다" };
  if (buffer.length > MAX_IMAGE_UPLOAD_BYTES) return { valid: false, error: "이미지는 10MB 이하만 업로드할 수 있습니다" };

  const detectedMimeType = detectImageMimeFromBuffer(buffer);
  if (!detectedMimeType) return { valid: false, error: "이미지 파일 내용이 올바르지 않습니다" };
  if (detectedMimeType !== declaredMimeType) {
    return { valid: false, error: "이미지 MIME 타입과 실제 파일 내용이 일치하지 않습니다", detectedMimeType };
  }

  return { valid: true, detectedMimeType };
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
