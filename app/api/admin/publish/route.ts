import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { execSync } from "child_process";

const CONTENT_DIR = path.join(process.cwd(), "content/posts");

interface PublishPost {
  slug: string;
  frontmatter: Record<string, unknown>;
  includeEn: boolean;
  enSlug?: string;
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

  for (const { slug, frontmatter, includeEn, enSlug } of posts) {
    const koFile = path.join(CONTENT_DIR, `${slug}.mdx`);
    if (fs.existsSync(koFile)) {
      updateFrontmatter(koFile, { ...frontmatter, draft: false });
      filesToCommit.push(`content/posts/${slug}.mdx`);
    }

    if (includeEn && enSlug) {
      const enFile = path.join(CONTENT_DIR, `${enSlug}.mdx`);
      if (fs.existsSync(enFile)) {
        updateFrontmatter(enFile, {
          categories: frontmatter.categories,
          tags: frontmatter.tags,
          image: frontmatter.image,
          draft: false,
        });
        filesToCommit.push(`content/posts/${enSlug}.mdx`);
      }
    }
  }

  return filesToCommit;
}

function buildCommitMessage(posts: PublishPost[]): string {
  if (posts.length === 1) {
    return `docs: '${posts[0].frontmatter.title || posts[0].slug}' 발행`;
  }
  const titles = posts.map((p) => `- ${p.frontmatter.title || p.slug}`).join("\n");
  return `docs: ${posts.length}개 포스트 발행\n\n${titles}`;
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

    const filesToCommit = prepareFiles(posts);

    if (filesToCommit.length === 0) {
      return NextResponse.json({ error: "발행할 파일이 없습니다" }, { status: 400 });
    }

    const commitMsg = buildCommitMessage(posts);
    const tmpFile = "/tmp/admin-publish-msg.txt";

    if (mode === "pr") {
      // PR 모드: 브랜치 생성 → 커밋 → 푸시 → PR 생성
      const date = new Date().toISOString().slice(0, 10);
      const branchName = `publish/${date}-${posts.length === 1 ? posts[0].slug : `${posts.length}-posts`}`;

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
        // main으로 복귀
        execSync("git checkout main", { cwd });
      }
    }

    // Direct 모드: 기존 동작
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
