import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface FileInfo {
  filename: string;
  path: string;
  size: number;
  modifiedAt: string;
}

function generateSlug(title: string): string {
  // Try to convert Korean to English (simple version - could be enhanced with translation API)
  let slug = title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

  // If still contains Korean, just use the original filename
  return slug;
}

// GET: List .md files in a directory
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const vaultPath = searchParams.get("path");

    if (!vaultPath) {
      return NextResponse.json({ success: false, error: "path 파라미터가 필요합니다" }, { status: 400 });
    }

    if (!fs.existsSync(vaultPath)) {
      return NextResponse.json({ success: false, error: "디렉토리가 존재하지 않습니다" }, { status: 400 });
    }

    const stat = fs.statSync(vaultPath);
    if (!stat.isDirectory()) {
      return NextResponse.json({ success: false, error: "유효한 디렉토리 경로가 아닙니다" }, { status: 400 });
    }

    const files: FileInfo[] = [];
    const entries = fs.readdirSync(vaultPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".md")) {
        const filePath = path.join(vaultPath, entry.name);
        const stats = fs.statSync(filePath);
        files.push({
          filename: entry.name,
          path: filePath,
          size: stats.size,
          modifiedAt: stats.mtime.toISOString(),
        });
      }
    }

    // Sort by modified date (newest first)
    files.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());

    return NextResponse.json({ success: true, files });
  } catch (error) {
    console.error("Obsidian GET error:", error);
    return NextResponse.json({ success: false, error: "파일 목록을 가져오는데 실패했습니다" }, { status: 500 });
  }
}

// POST: Import selected files
export async function POST(req: NextRequest) {
  try {
    const { files, targetCollection } = await req.json();

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ success: false, error: "가져올 파일을 선택해주세요" }, { status: 400 });
    }

    if (!["posts", "articles", "notes", "library"].includes(targetCollection)) {
      return NextResponse.json({ success: false, error: "유효한 컬렉션을 선택해주세요" }, { status: 400 });
    }

    const contentDir = path.join(process.cwd(), "content", targetCollection);
    if (!fs.existsSync(contentDir)) {
      fs.mkdirSync(contentDir, { recursive: true });
    }

    const results: Array<{ file: string; success: boolean; error?: string; outputPath?: string }> = [];

    for (const filePath of files) {
      try {
        if (!fs.existsSync(filePath)) {
          results.push({ file: filePath, success: false, error: "파일이 존재하지 않습니다" });
          continue;
        }

        const content = fs.readFileSync(filePath, "utf-8");
        const filename = path.basename(filePath, ".md");
        const stats = fs.statSync(filePath);

        // Generate slug from filename
        const slug = generateSlug(filename);
        const outputFilename = `${slug}.mdx`;
        const outputPath = path.join(contentDir, outputFilename);

        // Check if file already exists
        if (fs.existsSync(outputPath)) {
          results.push({ file: filePath, success: false, error: "파일이 이미 존재합니다" });
          continue;
        }

        // Parse existing frontmatter if it exists
        let body = content;
        let existingFrontmatter: Record<string, any> = {};
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

        if (frontmatterMatch) {
          body = frontmatterMatch[2];
          // Simple YAML parsing for common fields
          const fmContent = frontmatterMatch[1];
          const titleMatch = fmContent.match(/title:\s*(.+)/);
          const dateMatch = fmContent.match(/date:\s*(.+)/);
          const descMatch = fmContent.match(/description:\s*(.+)/);

          if (titleMatch) existingFrontmatter.title = titleMatch[1].replace(/['"]/g, "").trim();
          if (dateMatch) existingFrontmatter.date = dateMatch[1].replace(/['"]/g, "").trim();
          if (descMatch) existingFrontmatter.description = descMatch[1].replace(/['"]/g, "").trim();
        }

        // Build new frontmatter
        const title = existingFrontmatter.title || filename;
        const date = existingFrontmatter.date || stats.mtime.toISOString().split("T")[0];
        const description = existingFrontmatter.description || "";

        const lines = ["---"];
        lines.push(`title: "${title}"`);
        lines.push(`date: ${date}`);
        if (description) lines.push(`description: "${description}"`);
        lines.push("categories: []");
        lines.push("tags: []");

        // Collection-specific fields
        if (targetCollection === "posts") {
          lines.push('author: 이영수');
          lines.push("lang: ko");
          lines.push("draft: true");
          lines.push("toc: true");
          lines.push("comments: true");
        } else if (targetCollection === "articles") {
          lines.push("status: seed");
        } else if (targetCollection === "library") {
          lines.push("mediaType: book");
        }

        lines.push("---");
        lines.push("");
        lines.push(body.trim());
        lines.push("");

        fs.writeFileSync(outputPath, lines.join("\n"), "utf-8");

        results.push({
          file: filePath,
          success: true,
          outputPath: `content/${targetCollection}/${outputFilename}`,
        });
      } catch (error) {
        results.push({
          file: filePath,
          success: false,
          error: error instanceof Error ? error.message : "알 수 없는 오류",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      summary: { total: files.length, success: successCount, failed: failCount },
      results,
    });
  } catch (error) {
    console.error("Obsidian POST error:", error);
    return NextResponse.json({ success: false, error: "파일 가져오기에 실패했습니다" }, { status: 500 });
  }
}
