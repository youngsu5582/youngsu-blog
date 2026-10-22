import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import { execFileSync } from "child_process";
import { updateFrontmatter } from "@/lib/frontmatter";
import { validateMdx } from "@/lib/mdx-validator";
import { buildContentFilePath, isAllowedGeneratedPath, normalizeRepoRelativePath } from "@/lib/admin-content-paths";
import { BLOG_REPO_ROOT } from "@/lib/blog-repo-root";

function git(args: string[], cwd: string) {
  return execFileSync("git", args, { cwd, encoding: "utf-8" });
}

function gh(args: string[], cwd: string) {
  return execFileSync("gh", args, { cwd, encoding: "utf-8" }).trim();
}

function commandErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const details = error as { stderr?: string | Buffer; stdout?: string | Buffer; message?: string };
    const stderr = details.stderr?.toString().trim();
    const stdout = details.stdout?.toString().trim();
    if (stderr) return stderr;
    if (stdout) return stdout;
    if (details.message) return details.message;
  }
  return String(error);
}

function resolveRepoPath(repoRoot: string, filePath: string): string | null {
  const normalized = normalizeRepoRelativePath(filePath);
  if (!normalized || !isAllowedGeneratedPath(normalized)) return null;

  const root = path.resolve(repoRoot);
  const absPath = path.resolve(root, normalized);
  return absPath.startsWith(root + path.sep) ? absPath : null;
}

function normalizeGeneratedFile(filePath: string, repoRoot = BLOG_REPO_ROOT): string | null {
  const normalized = normalizeRepoRelativePath(filePath);
  if (!normalized || !isAllowedGeneratedPath(normalized)) return null;
  return fs.existsSync(resolveRepoPath(repoRoot, normalized) || "") ? normalized : null;
}

function copyRepoFile(repoPath: string, sourceRoot: string, targetRoot: string): boolean {
  const sourcePath = resolveRepoPath(sourceRoot, repoPath);
  const targetPath = resolveRepoPath(targetRoot, repoPath);
  if (!sourcePath || !targetPath || !fs.existsSync(sourcePath)) return false;

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  if (sourcePath !== targetPath) fs.copyFileSync(sourcePath, targetPath);
  return true;
}

function addCommitFile(filesToCommit: string[], filePath: string) {
  if (!filesToCommit.includes(filePath)) filesToCommit.push(filePath);
}

interface PublishPost {
  slug: string;
  collection?: string;
  frontmatter: Record<string, unknown>;
  includeEn: boolean;
  enSlug?: string;
  generatedFiles?: string[];
  gitStatus?: "new" | "modified";
}

function prepareFiles(posts: PublishPost[], sourceRoot: string, targetRoot: string): string[] {
  const filesToCommit: string[] = [];

  for (const { slug, collection = "posts", frontmatter, includeEn, enSlug, generatedFiles } of posts) {
    const sourceKoPath = buildContentFilePath(collection, slug, sourceRoot);
    const targetKoPath = buildContentFilePath(collection, slug, targetRoot);
    if (!sourceKoPath || !targetKoPath) continue;

    if (copyRepoFile(sourceKoPath.repoPath, sourceRoot, targetRoot)) {
      const koUpdate = collection === "posts"
        ? { ...frontmatter, draft: false }
        : { ...frontmatter };
      updateFrontmatter(targetKoPath.absPath, koUpdate);
      addCommitFile(filesToCommit, targetKoPath.repoPath);
    }

    if (includeEn && enSlug) {
      const sourceEnPath = buildContentFilePath(collection, enSlug, sourceRoot);
      const targetEnPath = buildContentFilePath(collection, enSlug, targetRoot);
      if (sourceEnPath && targetEnPath && copyRepoFile(sourceEnPath.repoPath, sourceRoot, targetRoot)) {
        const enUpdate: Record<string, unknown> = {
          categories: frontmatter.categories,
          tags: frontmatter.tags,
          image: frontmatter.image,
        };
        if (collection === "posts") enUpdate.draft = false;
        updateFrontmatter(targetEnPath.absPath, enUpdate);
        addCommitFile(filesToCommit, targetEnPath.repoPath);
      }
    }

    // Add generated files (thumbnails, translations).
    for (const genFile of generatedFiles || []) {
      const safeFile = normalizeGeneratedFile(genFile, sourceRoot);
      if (safeFile && copyRepoFile(safeFile, sourceRoot, targetRoot)) {
        addCommitFile(filesToCommit, safeFile);
      }
    }

    // Include the thumbnail referenced by frontmatter when it exists locally.
    if (typeof frontmatter.image === "string" && frontmatter.image.startsWith("/")) {
      const thumbRelPath = `public${frontmatter.image}`;
      const safeThumb = normalizeGeneratedFile(thumbRelPath, sourceRoot);
      if (safeThumb && copyRepoFile(safeThumb, sourceRoot, targetRoot)) {
        addCommitFile(filesToCommit, safeThumb);
      }
    }
  }

  return filesToCommit;
}

function buildCommitMessage(posts: PublishPost[]): string {
  if (posts.length === 1) {
    const post = posts[0];
    const action = post.gitStatus === "modified" ? "수정" : "발행";
    return `docs: '${post.frontmatter.title || post.slug}' ${action}`;
  }
  const hasModified = posts.some((p) => p.gitStatus === "modified");
  const hasNew = posts.some((p) => p.gitStatus !== "modified");
  const action = hasModified && hasNew ? "발행/수정" : hasModified ? "수정" : "발행";
  const titles = posts.map((p) => `- ${p.frontmatter.title || p.slug}`).join("\n");
  return `docs: ${posts.length}개 포스트 ${action}\n\n${titles}`;
}

function makeWorktreePath(): string {
  return path.join(os.tmpdir(), `admin-publish-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
}

function makeBranchName(posts: PublishPost[]): string {
  const date = new Date().toISOString().slice(0, 10);
  const time = new Date().toTimeString().slice(0, 8).replace(/:/g, "");
  const slug = posts.length === 1 ? posts[0].slug : `${posts.length}-posts`;
  return `publish/${date}-${slug}-${time}`;
}

function commitFiles(worktreePath: string, filesToCommit: string[], commitMsg: string): string {
  for (const file of filesToCommit) {
    git(["add", "--", file], worktreePath);
  }

  const tmpFile = path.join(os.tmpdir(), `admin-publish-${Date.now()}.txt`);
  try {
    fs.writeFileSync(tmpFile, commitMsg, "utf-8");
    git(["commit", "-F", tmpFile], worktreePath);
    return git(["rev-parse", "--short", "HEAD"], worktreePath).trim();
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
}

function removeWorktree(cwd: string, worktreePath: string) {
  try {
    git(["worktree", "remove", "--force", worktreePath], cwd);
  } catch {
    // Cleanup must not hide the original publish error.
  }
}

function deleteLocalBranch(cwd: string, branchName: string) {
  try {
    git(["branch", "-D", branchName], cwd);
  } catch {
    // The branch may not have been created yet.
  }
}

async function validatePosts(posts: PublishPost[]) {
  const validationErrors: Array<{ slug: string; errors: Array<{ line?: number; column?: number; message: string }> }> = [];

  for (const { slug, collection = "posts" } of posts) {
    const contentPath = buildContentFilePath(collection, slug);
    if (!contentPath || !fs.existsSync(contentPath.absPath)) continue;

    const raw = fs.readFileSync(contentPath.absPath, "utf-8");
    const bodyMatch = raw.match(/^---[\s\S]*?---\s*([\s\S]*)$/);
    const mdxBody = bodyMatch ? bodyMatch[1] : raw;
    const result = await validateMdx(mdxBody);
    if (!result.valid) validationErrors.push({ slug, errors: result.errors });
  }

  return validationErrors;
}

function validationResponse(validationErrors: Array<{ slug: string; errors: Array<{ line?: number; column?: number; message: string }> }>) {
  const detail = validationErrors.map((v) =>
    `${v.slug}: ${v.errors.map((e) => `${e.line ? `L${e.line}` : ""} ${e.message}`).join(", ")}`
  ).join("\n");
  return NextResponse.json({
    success: false,
    phase: "validation",
    error: `MDX 파싱 에러가 있어 발행할 수 없습니다:\n${detail}`,
    validationErrors,
  }, { status: 400 });
}

export async function POST(req: Request) {
  const cwd = BLOG_REPO_ROOT;
  let worktreePath: string | null = null;
  let branchName: string | null = null;
  let keepLocalBranch = false;

  try {
    const body = await req.json();
    const posts: PublishPost[] = body.posts ?? [
      { slug: body.slug, frontmatter: body.frontmatter, includeEn: body.includeEn, enSlug: body.enSlug },
    ];
    const mode: "direct" | "pr" = body.mode ?? "direct";
    const autoPush: boolean = body.autoPush ?? false;

    const validationErrors = await validatePosts(posts);
    if (validationErrors.length > 0) return validationResponse(validationErrors);

    if (mode !== "pr" && mode !== "direct") {
      return NextResponse.json({ success: false, phase: "request", error: "지원하지 않는 발행 방식입니다" }, { status: 400 });
    }

    // Every publish operation starts from the latest remote main. This avoids
    // committing on whichever branch happens to be checked out in the shared
    // Admin checkout and protects unrelated drafts in that checkout.
    git(["fetch", "origin", "main"], cwd);

    worktreePath = makeWorktreePath();
    branchName = makeBranchName(posts);
    git(["worktree", "add", "--detach", worktreePath, "origin/main"], cwd);
    git(["checkout", "-b", branchName], worktreePath);

    const filesToCommit = prepareFiles(posts, cwd, worktreePath);
    if (filesToCommit.length === 0) {
      return NextResponse.json({ success: false, phase: "prepare", error: "발행할 파일이 없습니다" }, { status: 400 });
    }

    const commitMsg = buildCommitMessage(posts);
    let hash = commitFiles(worktreePath, filesToCommit, commitMsg);
    keepLocalBranch = true;

    if (mode === "pr") {
      git(["push", "-u", "origin", branchName], worktreePath);
      const prTitle = posts.length === 1
        ? `docs: '${posts[0].frontmatter.title || posts[0].slug}' 발행`
        : `docs: ${posts.length}개 포스트 발행`;
      const prBody = posts.map((p) => `- ${p.frontmatter.title || p.slug}`).join("\n");
      const prUrl = gh(["pr", "create", "--title", prTitle, "--body", prBody], worktreePath);

      keepLocalBranch = false;
      return NextResponse.json({
        success: true,
        mode: "pr",
        hash,
        files: filesToCommit,
        branch: branchName,
        prUrl,
      });
    }

    if (!autoPush) {
      return NextResponse.json({
        success: true,
        mode: "direct",
        hash,
        files: filesToCommit,
        pushed: false,
        branch: branchName,
        message: "origin/main 기준 로컬 publish 브랜치에 커밋했습니다. 아직 원격 main에는 반영하지 않았습니다.",
      });
    }

    let pushError: string | undefined;
    try {
      // Push the commit we just created, not the stale local main ref.
      git(["push", "origin", "HEAD:main"], worktreePath);
    } catch (firstError) {
      // A concurrent main push may happen after fetch. Rebase once onto the
      // latest remote main, then retry without force-pushing.
      try {
        git(["fetch", "origin", "main"], cwd);
        git(["rebase", "origin/main"], worktreePath);
        git(["push", "origin", "HEAD:main"], worktreePath);
        hash = git(["rev-parse", "--short", "HEAD"], worktreePath).trim();
      } catch (retryError) {
        try { git(["rebase", "--abort"], worktreePath); } catch {}
        pushError = [commandErrorMessage(firstError), commandErrorMessage(retryError)].join("\n재시도 결과: ");
      }
    }

    if (pushError) {
      return NextResponse.json({
        success: false,
        mode: "direct",
        phase: "push",
        error: `커밋은 생성됐지만 origin/main 푸시에 실패했습니다.\n${pushError}`,
        hash,
        files: filesToCommit,
        branch: branchName,
        pushed: false,
      }, { status: 409 });
    }

    keepLocalBranch = false;
    return NextResponse.json({
      success: true,
      mode: "direct",
      hash,
      files: filesToCommit,
      pushed: true,
      branch: branchName,
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      phase: "git",
      error: commandErrorMessage(err),
      branch: branchName,
    }, { status: 500 });
  } finally {
    if (worktreePath) removeWorktree(cwd, worktreePath);
    if (branchName && !keepLocalBranch) deleteLocalBranch(cwd, branchName);
  }
}
