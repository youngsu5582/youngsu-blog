import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { updateFrontmatter } from "@/lib/frontmatter";

const CONTENT_ROOT = path.join(process.cwd(), "content");

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
      updateFrontmatter(koFile, { ...frontmatter, draft: false });
      filesToCommit.push(`content/${collection}/${slug}.mdx`);
    }

    if (includeEn && enSlug) {
      const enFile = path.join(contentDir, `${enSlug}.mdx`);
      if (fs.existsSync(enFile)) {
        updateFrontmatter(enFile, {
          categories: frontmatter.categories,
          tags: frontmatter.tags,
          image: frontmatter.image,
          draft: false,
        });
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

    if (mode === "pr") {
      // PR 모드: 수정 → 브랜치 → 커밋 → 푸시 → PR → main 복귀
      const filesToCommit = prepareFiles(posts);
      if (filesToCommit.length === 0) {
        return NextResponse.json({ error: "발행할 파일이 없습니다" }, { status: 400 });
      }

      const commitMsg = buildCommitMessage(posts);
      const tmpFile = path.join(require("os").tmpdir(), `admin-publish-${Date.now()}.txt`);
      const now = new Date();
      const date = now.toISOString().slice(0, 10);
      const time = now.toTimeString().slice(0, 8).replace(/:/g, "");
      const branchName = `publish/${date}-${posts.length === 1 ? posts[0].slug : `${posts.length}-posts`}-${time}`;

      // 변경된 파일을 stash → 브랜치에서 커밋 → main 복귀 후 stash pop
      // 이렇게 하면 로컬에도 draft: false 상태가 유지됨
      execSync(`git stash push -- ${filesToCommit.map(f => `"${f}"`).join(" ")}`, { cwd });
      execSync(`git checkout -b "${branchName}"`, { cwd });

      try {
        execSync("git stash pop", { cwd });

        for (const f of filesToCommit) {
          execSync(`git add "${f}"`, { cwd });
        }

        fs.writeFileSync(tmpFile, commitMsg, "utf-8");
        execSync(`git commit -F "${tmpFile}"`, { cwd, encoding: "utf-8" });
        if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);

        const hash = execSync("git rev-parse --short HEAD", { cwd, encoding: "utf-8" }).trim();

        execSync(`git push -u origin "${branchName}"`, { cwd, encoding: "utf-8" });

        // PR 생성
        const prTitle = posts.length === 1
          ? `docs: '${posts[0].frontmatter.title || posts[0].slug}' 발행`
          : `docs: ${posts.length}개 포스트 발행`;

        const prBody = posts.map((p) => `- ${p.frontmatter.title || p.slug}`).join("\\n");

        const prUrl = execSync(
          `gh pr create --title "${prTitle.replace(/"/g, '\\"')}" --body "${prBody}"`,
          { cwd, encoding: "utf-8" },
        ).trim();

        // main 복귀 (로컬 파일은 수정된 상태 유지)
        execSync("git checkout main", { cwd });
        try { execSync(`git branch -D "${branchName}"`, { cwd }); } catch {}

        // main에서도 변경사항 적용 (unstaged 상태로)
        for (const { slug, collection = "posts", frontmatter, includeEn, enSlug } of posts) {
          const koFile = path.join(CONTENT_ROOT, collection, `${slug}.mdx`);
          if (fs.existsSync(koFile)) {
            updateFrontmatter(koFile, { ...frontmatter, draft: false });
          }
          if (includeEn && enSlug) {
            const enFile = path.join(CONTENT_ROOT, collection, `${enSlug}.mdx`);
            if (fs.existsSync(enFile)) {
              updateFrontmatter(enFile, { categories: frontmatter.categories, tags: frontmatter.tags, image: frontmatter.image, draft: false });
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
        try { execSync("git checkout main", { cwd }); } catch {}
        try { execSync(`git branch -D "${branchName}"`, { cwd }); } catch {}
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
    const tmpFile = path.join(require("os").tmpdir(), `admin-publish-${Date.now()}.txt`);

    for (const f of filesToCommit) {
      execSync(`git add "${f}"`, { cwd });
    }

    fs.writeFileSync(tmpFile, commitMsg, "utf-8");
    execSync(`git commit -F "${tmpFile}"`, { cwd, encoding: "utf-8" });
    fs.unlinkSync(tmpFile);

    const hash = execSync("git rev-parse --short HEAD", { cwd, encoding: "utf-8" }).trim();

    let pushed = false;
    let pushError: string | undefined;
    if (autoPush) {
      try {
        execSync("git push origin main", { cwd, encoding: "utf-8" });
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
