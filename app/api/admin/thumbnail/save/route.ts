import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

export async function POST(req: Request) {
  try {
    const { base64, filename, originalPath } = await req.json();

    if (!base64 || !filename) {
      return NextResponse.json(
        { error: "base64와 filename이 필요합니다" },
        { status: 400 }
      );
    }

    // Create directory if it doesn't exist
    const thumbnailDir = path.join(process.cwd(), "public/assets/img/thumbnail");
    if (!fs.existsSync(thumbnailDir)) {
      fs.mkdirSync(thumbnailDir, { recursive: true });
    }

    // Save image
    const imagePath = path.join(thumbnailDir, `${filename}.png`);
    const imageBuffer = Buffer.from(base64, "base64");
    fs.writeFileSync(imagePath, imageBuffer);

    const publicUrl = `/assets/img/thumbnail/${filename}.png`;

    // Auto-update frontmatter if originalPath is provided
    const updatedFiles: string[] = [];
    if (originalPath) {
      try {
        const absPath = originalPath.startsWith("/")
          ? originalPath
          : path.join(process.cwd(), originalPath);

        if (fs.existsSync(absPath)) {
          // Update original file
          const raw = fs.readFileSync(absPath, "utf-8");
          const { data, content } = matter(raw);
          data.image = publicUrl;
          const updated = matter.stringify(content, data);
          fs.writeFileSync(absPath, updated, "utf-8");
          updatedFiles.push(absPath);

          // Update English version if exists
          const enPath = absPath.replace(/\.mdx?$/, "-en.mdx");
          if (fs.existsSync(enPath)) {
            const enRaw = fs.readFileSync(enPath, "utf-8");
            const enParsed = matter(enRaw);
            enParsed.data.image = publicUrl;
            const enUpdated = matter.stringify(enParsed.content, enParsed.data);
            fs.writeFileSync(enPath, enUpdated, "utf-8");
            updatedFiles.push(enPath);
          }
        }
      } catch (fmErr: any) {
        console.error("Frontmatter update error:", fmErr);
        // Don't fail the whole operation if frontmatter update fails
      }
    }

    return NextResponse.json({
      success: true,
      filePath: publicUrl,
      existed: false,
      frontmatterUpdated: updatedFiles.length > 0,
      updatedFiles,
    });
  } catch (err: any) {
    console.error("Thumbnail save error:", err);
    return NextResponse.json(
      { error: `이미지 저장 실패: ${err.message || String(err)}` },
      { status: 500 }
    );
  }
}
