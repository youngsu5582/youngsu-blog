import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { buildSafeUploadName, validateImageBuffer, validateImageUpload } from "@/lib/admin-upload-validation";

const UPLOAD_DIR = path.join(process.cwd(), "public/assets/img/uploads");

type UploadedFile = { name: string; path: string };
type RejectedFile = { name: string; error: string };

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files").filter((file): file is File => file instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: "파일이 없습니다" }, { status: 400 });
    }

    const uploadedFiles: UploadedFile[] = [];
    const rejectedFiles: RejectedFile[] = [];

    for (const file of files) {
      const metadataValidation = validateImageUpload(file);
      if (!metadataValidation.valid) {
        rejectedFiles.push({ name: file.name, error: metadataValidation.error || "업로드할 수 없는 파일입니다" });
        continue;
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const contentValidation = validateImageBuffer(buffer, file.type);
      if (!contentValidation.valid) {
        rejectedFiles.push({ name: file.name, error: contentValidation.error || "이미지 파일 내용이 올바르지 않습니다" });
        continue;
      }

      const timestamp = Date.now();
      const filename = buildSafeUploadName(timestamp, file.name, file.type);
      const filepath = path.join(UPLOAD_DIR, filename);
      fs.writeFileSync(filepath, buffer);

      uploadedFiles.push({
        name: file.name,
        path: `/assets/img/uploads/${filename}`,
      });
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json({ error: "이미지 파일이 없습니다", rejectedFiles }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      rejectedFiles,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
