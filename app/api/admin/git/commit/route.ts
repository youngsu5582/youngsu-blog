import { NextResponse } from "next/server";
import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { normalizeRepoRelativePath } from "@/lib/admin-content-paths";

const ALLOWED_COMMIT_PREFIXES = ["content/", "public/assets/img/", "app/", "components/", "lib/", "__tests__/"];

function runGit(args: string[], cwd: string) {
  return execFileSync("git", args, { cwd, encoding: "utf-8" });
}

function normalizeCommitFiles(files: unknown): string[] | null {
  if (!Array.isArray(files) || files.length === 0) return null;

  const normalized = files
    .map((file) => typeof file === "string" ? normalizeRepoRelativePath(file) : null)
    .filter((file): file is string => Boolean(file));

  if (normalized.length !== files.length) return null;
  if (!normalized.every((file) => ALLOWED_COMMIT_PREFIXES.some((prefix) => file.startsWith(prefix)))) return null;

  return Array.from(new Set(normalized));
}

export async function POST(req: Request) {
  const cwd = process.cwd();
  let tmpFile: string | null = null;

  try {
    const { message, files } = await req.json();
    const commitFiles = normalizeCommitFiles(files);

    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "커밋 메시지가 필요합니다" }, { status: 400 });
    }

    if (!commitFiles) {
      return NextResponse.json({ error: "files must be a non-empty array of allowed repo-relative paths" }, { status: 400 });
    }

    for (const file of commitFiles) {
      runGit(["add", "--", file], cwd);
    }

    tmpFile = path.join(os.tmpdir(), `admin-commit-msg-${Date.now()}.txt`);
    fs.writeFileSync(tmpFile, message, "utf-8");
    const result = runGit(["commit", "-F", tmpFile], cwd);

    const hash = runGit(["rev-parse", "--short", "HEAD"], cwd).trim();

    return NextResponse.json({ success: true, hash, output: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    if (tmpFile && fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
}
