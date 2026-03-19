import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public/assets/img/uploads");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "파일이 없습니다" }, { status: 400 });
    }

    const uploadedFiles: { name: string; path: string }[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        continue; // Skip non-image files
      }

      // Generate unique filename: timestamp-originalname
      const timestamp = Date.now();
      const ext = path.extname(file.name);
      const basename = path.basename(file.name, ext);
      const safeBasename = basename.replace(/[^a-zA-Z0-9가-힣-_]/g, "-");
      const filename = `${timestamp}-${safeBasename}${ext}`;

      // Save file
      const filepath = path.join(UPLOAD_DIR, filename);
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      fs.writeFileSync(filepath, buffer);

      uploadedFiles.push({
        name: file.name,
        path: `/assets/img/uploads/${filename}`,
      });
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json({ error: "이미지 파일이 없습니다" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
