import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { resolveRepoFilePath } from "@/lib/admin-content-paths";
import { detectImageMimeFromBuffer, extensionForMime, validateImageBuffer } from "@/lib/admin-upload-validation";

const ALLOWED_THUMBNAIL_CONTENT_PREFIXES = [
  "content/posts/",
  "content/articles/",
  "content/notes/",
  "content/library/",
];
const THUMBNAIL_DIR = path.join(process.cwd(), "public/assets/img/thumbnail");

function validateThumbnailFilename(filename: unknown): { valid: boolean; value?: string; error?: string } {
  if (typeof filename !== "string" || !filename.trim()) {
    return { valid: false, error: "filename이 필요합니다" };
  }

  const normalized = filename.trim();
  if (!/^[a-zA-Z0-9가-힣_-]+$/.test(normalized)) {
    return { valid: false, error: "썸네일 파일명은 문자, 숫자, 하이픈, 언더스코어만 사용할 수 있습니다" };
  }

  return { valid: true, value: normalized };
}

function decodeBase64Image(base64: unknown): { buffer?: Buffer; mimeType?: string; ext?: string; error?: string } {
  if (typeof base64 !== "string" || !base64.trim()) return { error: "base64가 필요합니다" };
  if (!/^[A-Za-z0-9+/=\s]+$/.test(base64)) return { error: "base64 형식이 올바르지 않습니다" };

  const buffer = Buffer.from(base64, "base64");
  const mimeType = detectImageMimeFromBuffer(buffer);
  if (!mimeType) return { error: "이미지 파일 내용이 올바르지 않습니다" };

  const validation = validateImageBuffer(buffer, mimeType);
  if (!validation.valid) return { error: validation.error };

  const ext = extensionForMime(mimeType)?.replace(/^\./, "");
  if (!ext || ext === "gif") return { error: "썸네일은 jpg, png, webp 형식만 저장할 수 있습니다" };

  return { buffer, mimeType, ext };
}

function resolveEnglishContentPath(originalRepoPath: string) {
  const enRepoPath = originalRepoPath.replace(/\.mdx?$/, "-en.mdx");
  if (enRepoPath === originalRepoPath) return null;
  return resolveRepoFilePath(enRepoPath, ALLOWED_THUMBNAIL_CONTENT_PREFIXES);
}

export async function POST(req: Request) {
  try {
    const { base64, filename, originalPath } = await req.json();
    const safeFilename = validateThumbnailFilename(filename);
    const image = decodeBase64Image(base64);

    if (!safeFilename.valid) {
      return NextResponse.json({ error: safeFilename.error }, { status: 400 });
    }

    if (image.error || !image.buffer || !image.ext) {
      return NextResponse.json({ error: image.error || "이미지 데이터가 올바르지 않습니다" }, { status: 400 });
    }

    if (!fs.existsSync(THUMBNAIL_DIR)) {
      fs.mkdirSync(THUMBNAIL_DIR, { recursive: true });
    }

    const imagePath = path.join(THUMBNAIL_DIR, `${safeFilename.value}.${image.ext}`);
    fs.writeFileSync(imagePath, image.buffer);

    const publicUrl = `/assets/img/thumbnail/${safeFilename.value}.${image.ext}`;

    const updatedFiles: string[] = [];
    if (typeof originalPath === "string" && originalPath.trim()) {
      try {
        const originalFile = resolveRepoFilePath(originalPath, ALLOWED_THUMBNAIL_CONTENT_PREFIXES);
        if (originalFile && fs.existsSync(originalFile.absPath)) {
          const raw = fs.readFileSync(originalFile.absPath, "utf-8");
          const { data, content } = matter(raw);
          data.image = publicUrl;
          fs.writeFileSync(originalFile.absPath, matter.stringify(content, data), "utf-8");
          updatedFiles.push(originalFile.repoPath);

          const enFile = resolveEnglishContentPath(originalFile.repoPath);
          if (enFile && fs.existsSync(enFile.absPath)) {
            const enRaw = fs.readFileSync(enFile.absPath, "utf-8");
            const enParsed = matter(enRaw);
            enParsed.data.image = publicUrl;
            fs.writeFileSync(enFile.absPath, matter.stringify(enParsed.content, enParsed.data), "utf-8");
            updatedFiles.push(enFile.repoPath);
          }
        }
      } catch (fmErr: unknown) {
        console.error("Frontmatter update error:", fmErr);
      }
    }

    return NextResponse.json({
      success: true,
      filePath: publicUrl,
      existed: false,
      frontmatterUpdated: updatedFiles.length > 0,
      updatedFiles,
    });
  } catch (err: unknown) {
    console.error("Thumbnail save error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `이미지 저장 실패: ${message}` },
      { status: 500 }
    );
  }
}
