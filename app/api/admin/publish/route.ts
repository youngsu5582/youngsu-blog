import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import { execFileSync } from "child_process";
import { updateFrontmatter } from "@/lib/frontmatter";
import { validateMdx } from "@/lib/mdx-validator";

const CONTENT_ROOT = path.join(process.cwd(), "content");

function git(args: string[], cwd: string) {
  return execFileSync("git", args, { cwd, encoding: "utf-8" });
}

function gh(args: string[], cwd: string) {
  return execFileSync("gh", args, { cwd, encoding: "utf-8" }).trim();
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

function prepareFiles(posts: PublishPost[]): string[] {
  const filesToCommit: string[] = [];

  for (const { slug, collection = "posts", frontmatter, includeEn, enSlug, generatedFiles } of posts) {
    const contentDir = path.join(CONTENT_ROOT, collection);
    const koFile = path.join(contentDir, `${slug}.mdx`);
    if (fs.existsSync(koFile)) {
      const koUpdate = collection === "posts"
        ? { ...frontmatter, draft: false }
        : { ...frontmatter };
      updateFrontmatter(koFile, koUpdate);
      filesToCommit.push(`content/${collection}/${slug}.mdx`);
    }

    if (includeEn && enSlug) {
      const enFile = path.join(contentDir, `${enSlug}.mdx`);
      if (fs.existsSync(enFile)) {
        const enUpdate: Record<string, unknown> = {
          categories: frontmatter.categories,
          tags: frontmatter.tags,
          image: frontmatter.image,
        };
        if (collection === "posts") enUpdate.draft = false;
        updateFrontmatter(enFile, enUpdate);
        filesToCommit.push(`content/${collection}/${enSlug}.mdx`);
      }
    }

    // Add generated files (thumbnails, translations)
    if (generatedFiles && generatedFiles.length > 0) {
      for (const genFile of generatedFiles) {
        if (genFile && !filesToCommit.includes(genFile)) {
          filesToCommit.push(genFile);
        }
      }
    }

    // frontmatter image 필드에서 썸네일 자동 포함
    if (typeof frontmatter.image === "string" && frontmatter.image.startsWith("/")) {
      const thumbRelPath = `public${frontmatter.image}`;
      const thumbAbsPath = path.join(process.cwd(), thumbRelPath);
      if (fs.existsSync(thumbAbsPath) && !filesToCommit.includes(thumbRelPath)) {
        filesToCommit.push(thumbRelPath);
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


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const cwd = process.cwd();

    // 하위 호환: 단일 포스트 요청도 배열로 변환
    const posts: PublishPost[] = body.posts ?? [
      { slug: body.slug, frontmatter: body.frontmatter, includeEn: body.includeEn, enSlug: body.enSlug },
    ];
    const mode: "direct" | "pr" = body.mode ?? "direct";
    const autoPush: boolean = body.autoPush ?? false;

    // MDX 파싱 검증 — 커밋 전에 빌드 에러를 잡는다
    const validationErrors: Array<{ slug: string; errors: Array<{ line?: number; column?: number; message: string }> }> = [];
    for (const { slug, collection = "posts" } of posts) {
      const filePath = path.join(CONTENT_ROOT, collection, `${slug}.mdx`);
      if (!fs.existsSync(filePath)) continue;
      const raw = fs.readFileSync(filePath, "utf-8");
      const bodyMatch = raw.match(/^---[\s\S]*?---\s*([\s\S]*)$/);
      const mdxBody = bodyMatch ? bodyMatch[1] : raw;
      const result = await validateMdx(mdxBody);
      if (!result.valid) {
        validationErrors.push({ slug, errors: result.errors });
      }
    }
    if (validationErrors.length > 0) {
      const detail = validationErrors.map(v =>
        `${v.slug}: ${v.errors.map(e => `${e.line ? `L${e.line}` : ""} ${e.message}`).join(", ")}`
      ).join("\n");
      return NextResponse.json({ error: `MDX 파싱 에러가 있어 발행할 수 없습니다:\n${detail}`, validationErrors }, { status: 400 });
    }

    if (mode === "pr") {
      // PR 모드: 수정 → 브랜치 → 커밋 → 푸시 → PR → main 복귀
      const filesToCommit = prepareFiles(posts);
      if (filesToCommit.length === 0) {
        return NextResponse.json({ error: "발행할 파일이 없습니다" }, { status: 400 });
      }

      const commitMsg = buildCommitMessage(posts);
      const tmpFile = path.join(os.tmpdir(), `admin-publish-${Date.now()}.txt`);
      const now = new Date();
      const date = now.toISOString().slice(0, 10);
      const time = now.toTimeString().slice(0, 8).replace(/:/g, "");
      const branchName = `publish/${date}-${posts.length === 1 ? posts[0].slug : `${posts.length}-posts`}-${time}`;

      // PR 생성 후 main으로 돌아와도 로컬 Admin에서 계속 보이도록 현재 파일 내용을 보관한다.
      // 신규 포스트/썸네일은 main에 없는 untracked 파일이라 checkout main 과정에서 사라질 수 있다.
      const localRestoreFiles = new Map<string, Buffer>();
      for (const f of filesToCommit) {
        const absPath = path.join(cwd, f);
        if (fs.existsSync(absPath)) {
          localRestoreFiles.set(f, fs.readFileSync(absPath));
        }
      }

      // 변경된 파일을 stash → 브랜치에서 커밋 → main 복귀 후 stash pop
      // 이렇게 하면 로컬에도 draft: false 상태가 유지됨
      // 신규 글/썸네일은 아직 git이 추적하지 않는 untracked 파일일 수 있으므로 -u가 필요함.
      git(["stash", "push", "-u", "--", ...filesToCommit], cwd);
      git(["checkout", "-b", branchName], cwd);

      try {
        git(["stash", "pop"], cwd);

        for (const f of filesToCommit) {
          git(["add", "--", f], cwd);
        }

        fs.writeFileSync(tmpFile, commitMsg, "utf-8");
        git(["commit", "-F", tmpFile], cwd);
        if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);

        const hash = git(["rev-parse", "--short", "HEAD"], cwd).trim();

        git(["push", "-u", "origin", branchName], cwd);

        // PR 생성
        const prTitle = posts.length === 1
          ? `docs: '${posts[0].frontmatter.title || posts[0].slug}' 발행`
          : `docs: ${posts.length}개 포스트 발행`;

        const prBody = posts.map((p) => `- ${p.frontmatter.title || p.slug}`).join("\\n");

        const prUrl = gh(["pr", "create", "--title", prTitle, "--body", prBody], cwd);

        // main 복귀 (로컬 파일은 수정된 상태 유지)
        git(["checkout", "main"], cwd);
        try { git(["branch", "-D", branchName], cwd); } catch {}

        // main에서도 PR에 넣은 파일을 로컬 작업트리에 복원한다.
        // 특히 신규 글/신규 썸네일은 main에 아직 없어서 checkout main 이후 사라진다.
        for (const [relPath, content] of localRestoreFiles.entries()) {
          const absPath = path.join(cwd, relPath);
          fs.mkdirSync(path.dirname(absPath), { recursive: true });
          fs.writeFileSync(absPath, content);
        }

        // main에서도 변경사항 적용 (unstaged 상태로)
        for (const { slug, collection = "posts", frontmatter, includeEn, enSlug } of posts) {
          const koFile = path.join(CONTENT_ROOT, collection, `${slug}.mdx`);
          if (fs.existsSync(koFile)) {
            const koUpdate = collection === "posts"
              ? { ...frontmatter, draft: false }
              : { ...frontmatter };
            updateFrontmatter(koFile, koUpdate);
          }
          if (includeEn && enSlug) {
            const enFile = path.join(CONTENT_ROOT, collection, `${enSlug}.mdx`);
            if (fs.existsSync(enFile)) {
              const enUpdate: Record<string, unknown> = {
                categories: frontmatter.categories,
                tags: frontmatter.tags,
                image: frontmatter.image,
              };
              if (collection === "posts") enUpdate.draft = false;
              updateFrontmatter(enFile, enUpdate);
            }
          }
        }

        return NextResponse.json({
          success: true,
          mode: "pr",
          hash,
          files: filesToCommit,
          branch: branchName,
          prUrl,
        });
      } catch (e) {
        // 실패 시 main 복귀
        try { git(["checkout", "main"], cwd); } catch {}
        try { git(["branch", "-D", branchName], cwd); } catch {}
        if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
        throw e;
      }
    }

    // Direct 모드: 기존 동작
    const filesToCommit = prepareFiles(posts);

    if (filesToCommit.length === 0) {
      return NextResponse.json({ error: "발행할 파일이 없습니다" }, { status: 400 });
    }

    const commitMsg = buildCommitMessage(posts);
    const tmpFile = path.join(os.tmpdir(), `admin-publish-${Date.now()}.txt`);

    for (const f of filesToCommit) {
      git(["add", "--", f], cwd);
    }

    fs.writeFileSync(tmpFile, commitMsg, "utf-8");
    git(["commit", "-F", tmpFile], cwd);
    fs.unlinkSync(tmpFile);

    const hash = git(["rev-parse", "--short", "HEAD"], cwd).trim();

    let pushed = false;
    let pushError: string | undefined;
    if (autoPush) {
      try {
        git(["push", "origin", "main"], cwd);
        pushed = true;
      } catch (e) {
        pushError = String(e);
      }
    }

    return NextResponse.json({
      success: true,
      mode: "direct",
      hash,
      files: filesToCommit,
      pushed,
      pushError,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
