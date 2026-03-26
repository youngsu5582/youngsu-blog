import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { execSync } from "child_process";

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

function updateFrontmatter(filePath: string, updates: Record<string, unknown>) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  const merged = { ...data, ...updates };

  const lines = ["---"];
  for (const [key, val] of Object.entries(merged)) {
    if (val === undefined || val === null) continue;
    if (Array.isArray(val)) {
      if (val.length === 0) {
        lines.push(`${key}: []`);
      } else {
        lines.push(`${key}:`);
        val.forEach((v: string) => {
          const str = String(v);
          lines.push(/^\d+$/.test(str) ? `  - "${str}"` : `  - ${str}`);
        });
      }
    } else if (typeof val === "boolean" || typeof val === "number") {
      lines.push(`${key}: ${val}`);
    } else {
      const str = String(val);
      if (str.includes(":") || str.includes("#") || str.includes('"')) {
        lines.push(`${key}: "${str.replace(/"/g, '\\"')}"`);
      } else {
        lines.push(`${key}: ${str}`);
      }
    }
  }
  lines.push("---");

  fs.writeFileSync(filePath, lines.join("\n") + "\n\n" + content.trim() + "\n", "utf-8");
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

function saveFileContents(cwd: string, posts: PublishPost[], filesToCommit: string[]): Map<string, Buffer> {
  const saved = new Map<string, Buffer>();
  // 콘텐츠 파일 (prepareFiles가 frontmatter 수정하므로 수정 전 저장)
  for (const { slug, collection = "posts", includeEn, enSlug } of posts) {
    const koFile = path.join(CONTENT_ROOT, collection, `${slug}.mdx`);
    if (fs.existsSync(koFile)) saved.set(koFile, fs.readFileSync(koFile));
    if (includeEn && enSlug) {
      const enFile = path.join(CONTENT_ROOT, collection, `${enSlug}.mdx`);
      if (fs.existsSync(enFile)) saved.set(enFile, fs.readFileSync(enFile));
    }
  }
  // 생성된 파일 (썸네일 등)
  for (const f of filesToCommit) {
    const fullPath = path.join(cwd, f);
    if (!saved.has(fullPath) && fs.existsSync(fullPath)) {
      saved.set(fullPath, fs.readFileSync(fullPath));
    }
  }
  return saved;
}

function restoreFiles(saved: Map<string, Buffer>) {
  for (const [filePath, content] of saved) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
  }
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
      // PR 모드: 원본 저장 → 수정 → 브랜치 → 커밋 → 푸시 → PR → 원본 복원
      // 1. 콘텐츠 파일 원본 저장 (prepareFiles가 frontmatter를 수정하기 전)
      const preSaveContents = new Map<string, Buffer>();
      for (const { slug, collection = "posts", includeEn, enSlug } of posts) {
        const koFile = path.join(CONTENT_ROOT, collection, `${slug}.mdx`);
        if (fs.existsSync(koFile)) preSaveContents.set(koFile, fs.readFileSync(koFile));
        if (includeEn && enSlug) {
          const enFile = path.join(CONTENT_ROOT, collection, `${enSlug}.mdx`);
          if (fs.existsSync(enFile)) preSaveContents.set(enFile, fs.readFileSync(enFile));
        }
      }

      // 2. frontmatter 수정 + 커밋 대상 파일 목록
      const filesToCommit = prepareFiles(posts);
      if (filesToCommit.length === 0) {
        restoreFiles(preSaveContents);
        return NextResponse.json({ error: "발행할 파일이 없습니다" }, { status: 400 });
      }

      // 3. 생성된 파일(썸네일 등)도 저장
      for (const f of filesToCommit) {
        const fullPath = path.join(cwd, f);
        if (!preSaveContents.has(fullPath) && fs.existsSync(fullPath)) {
          preSaveContents.set(fullPath, fs.readFileSync(fullPath));
        }
      }

      const commitMsg = buildCommitMessage(posts);
      const tmpFile = "/tmp/admin-publish-msg.txt";
      const now = new Date();
      const date = now.toISOString().slice(0, 10);
      const time = now.toTimeString().slice(0, 8).replace(/:/g, "");
      const branchName = `publish/${date}-${posts.length === 1 ? posts[0].slug : `${posts.length}-posts`}-${time}`;

      execSync(`git checkout -b "${branchName}"`, { cwd });

      try {
        for (const f of filesToCommit) {
          execSync(`git add "${f}"`, { cwd });
        }

        fs.writeFileSync(tmpFile, commitMsg, "utf-8");
        execSync(`git commit -F ${tmpFile}`, { cwd, encoding: "utf-8" });
        fs.unlinkSync(tmpFile);

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

        return NextResponse.json({
          success: true,
          mode: "pr",
          hash,
          files: filesToCommit,
          branch: branchName,
          prUrl,
        });
      } finally {
        // main 복귀 후 원본 파일 복원 + 로컬 브랜치 정리
        execSync("git checkout main", { cwd });
        try { execSync(`git branch -D "${branchName}"`, { cwd }); } catch {}
        restoreFiles(preSaveContents);
      }
    }

    // Direct 모드: 기존 동작
    const filesToCommit = prepareFiles(posts);

    if (filesToCommit.length === 0) {
      return NextResponse.json({ error: "발행할 파일이 없습니다" }, { status: 400 });
    }

    const commitMsg = buildCommitMessage(posts);
    const tmpFile = "/tmp/admin-publish-msg.txt";

    for (const f of filesToCommit) {
      execSync(`git add "${f}"`, { cwd });
    }

    fs.writeFileSync(tmpFile, commitMsg, "utf-8");
    execSync(`git commit -F ${tmpFile}`, { cwd, encoding: "utf-8" });
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
