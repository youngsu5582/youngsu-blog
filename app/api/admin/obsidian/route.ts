import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { buildContentFilePath, isAllowedCollection } from "@/lib/admin-content-paths";

interface FileInfo {
  filename: string;
  path: string;
  size: number;
  modifiedAt: string;
}

type ImportResult = { file: string; success: boolean; error?: string; outputPath?: string };
type ObsidianImportBody = {
  vaultPath?: unknown;
  files?: unknown;
  targetCollection?: unknown;
};

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .trim();
}

function resolveVaultDirectory(vaultPath: unknown): { root: string; error?: string } {
  if (typeof vaultPath !== "string" || !vaultPath.trim()) {
    return { root: "", error: "path 파라미터가 필요합니다" };
  }

  const resolved = path.resolve(vaultPath);
  if (!fs.existsSync(resolved)) {
    return { root: "", error: "디렉토리가 존재하지 않습니다" };
  }

  const realRoot = fs.realpathSync(resolved);
  const stat = fs.statSync(realRoot);
  if (!stat.isDirectory()) {
    return { root: "", error: "유효한 디렉토리 경로가 아닙니다" };
  }

  return { root: realRoot };
}

function resolveVaultMarkdownFile(vaultRoot: string, filePath: unknown): { absPath: string; filename: string; error?: string } {
  if (typeof filePath !== "string" || !filePath.trim()) {
    return { absPath: "", filename: "", error: "파일 경로가 올바르지 않습니다" };
  }

  const requestedPath = path.resolve(vaultRoot, filePath);
  if (!requestedPath.startsWith(vaultRoot + path.sep)) {
    return { absPath: "", filename: "", error: "Vault 밖의 파일은 가져올 수 없습니다" };
  }

  if (path.extname(requestedPath) !== ".md") {
    return { absPath: "", filename: "", error: ".md 파일만 가져올 수 있습니다" };
  }

  if (!fs.existsSync(requestedPath)) {
    return { absPath: "", filename: "", error: "파일이 존재하지 않습니다" };
  }

  const realFilePath = fs.realpathSync(requestedPath);
  if (!realFilePath.startsWith(vaultRoot + path.sep)) {
    return { absPath: "", filename: "", error: "Vault 밖의 파일은 가져올 수 없습니다" };
  }

  const stat = fs.statSync(realFilePath);
  if (!stat.isFile()) {
    return { absPath: "", filename: "", error: "파일 경로가 올바르지 않습니다" };
  }

  return { absPath: realFilePath, filename: path.basename(realFilePath, ".md") };
}

function parseSimpleFrontmatter(content: string) {
  let body = content;
  const existingFrontmatter: Record<string, string> = {};
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (frontmatterMatch) {
    body = frontmatterMatch[2];
    const fmContent = frontmatterMatch[1];
    const titleMatch = fmContent.match(/title:\s*(.+)/);
    const dateMatch = fmContent.match(/date:\s*(.+)/);
    const descMatch = fmContent.match(/description:\s*(.+)/);

    if (titleMatch) existingFrontmatter.title = titleMatch[1].replace(/['"]/g, "").trim();
    if (dateMatch) existingFrontmatter.date = dateMatch[1].replace(/['"]/g, "").trim();
    if (descMatch) existingFrontmatter.description = descMatch[1].replace(/['"]/g, "").trim();
  }

  return { body, existingFrontmatter };
}

function buildImportedMarkdown(params: {
  body: string;
  description: string;
  filename: string;
  modifiedAt: Date;
  targetCollection: string;
  title: string;
}) {
  const { body, description, filename, modifiedAt, targetCollection, title } = params;
  const date = modifiedAt.toISOString().split("T")[0];
  const lines = ["---"];
  lines.push(`title: "${title || filename}"`);
  lines.push(`date: ${date}`);
  if (description) lines.push(`description: "${description}"`);
  lines.push("categories: []");
  lines.push("tags: []");

  if (targetCollection === "posts") {
    lines.push("author: 이영수");
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
  return lines.join("\n");
}

// GET: List .md files in a directory
export async function GET(req: NextRequest) {
  try {
    const { root: vaultRoot, error } = resolveVaultDirectory(req.nextUrl.searchParams.get("path"));
    if (error) {
      return NextResponse.json({ success: false, error }, { status: 400 });
    }

    const files: FileInfo[] = [];
    const entries = fs.readdirSync(vaultRoot, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".md")) {
        const filePath = path.resolve(vaultRoot, entry.name);
        const stats = fs.statSync(filePath);
        files.push({
          filename: entry.name,
          path: filePath,
          size: stats.size,
          modifiedAt: stats.mtime.toISOString(),
        });
      }
    }

    files.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());

    return NextResponse.json({ success: true, vaultPath: vaultRoot, files });
  } catch (error) {
    console.error("Obsidian GET error:", error);
    return NextResponse.json({ success: false, error: "파일 목록을 가져오는데 실패했습니다" }, { status: 500 });
  }
}

// POST: Import selected files
export async function POST(req: NextRequest) {
  try {
    const { vaultPath, files, targetCollection } = (await req.json()) as ObsidianImportBody;

    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ success: false, error: "가져올 파일을 선택해주세요" }, { status: 400 });
    }

    if (typeof targetCollection !== "string" || !isAllowedCollection(targetCollection)) {
      return NextResponse.json({ success: false, error: "유효한 컬렉션을 선택해주세요" }, { status: 400 });
    }

    const { root: vaultRoot, error: vaultError } = resolveVaultDirectory(vaultPath);
    if (vaultError) {
      return NextResponse.json({ success: false, error: vaultError }, { status: 400 });
    }

    const results: ImportResult[] = [];

    for (const filePath of files) {
      const resultLabel = typeof filePath === "string" ? filePath : "";
      try {
        const inputFile = resolveVaultMarkdownFile(vaultRoot, filePath);
        if (inputFile.error) {
          results.push({ file: resultLabel, success: false, error: inputFile.error });
          continue;
        }

        const content = fs.readFileSync(inputFile.absPath, "utf-8");
        const stats = fs.statSync(inputFile.absPath);
        const { body, existingFrontmatter } = parseSimpleFrontmatter(content);
        const slug = generateSlug(inputFile.filename);
        const outputFile = buildContentFilePath(targetCollection, slug);

        if (!outputFile) {
          results.push({ file: inputFile.absPath, success: false, error: "생성된 slug가 유효하지 않습니다" });
          continue;
        }

        if (fs.existsSync(outputFile.absPath)) {
          results.push({ file: inputFile.absPath, success: false, error: "파일이 이미 존재합니다" });
          continue;
        }

        fs.mkdirSync(outputFile.contentDir, { recursive: true });
        fs.writeFileSync(outputFile.absPath, buildImportedMarkdown({
          body,
          description: existingFrontmatter.description || "",
          filename: inputFile.filename,
          modifiedAt: existingFrontmatter.date ? new Date(existingFrontmatter.date) : stats.mtime,
          targetCollection,
          title: existingFrontmatter.title || inputFile.filename,
        }), "utf-8");

        results.push({
          file: inputFile.absPath,
          success: true,
          outputPath: outputFile.repoPath,
        });
      } catch (error) {
        results.push({
          file: resultLabel,
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
