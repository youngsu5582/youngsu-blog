import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { serializeFrontmatter } from "@/lib/frontmatter";
import { isAllowedCollection, isValidSlug, resolveRepoFilePath } from "@/lib/admin-content-paths";

const EDITABLE_PREFIXES = ["content/"];
const DELETABLE_PREFIXES = ["content/", "public/assets/img/"];

// GET: 파일의 frontmatter + body 읽기
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get("file");

  if (!filePath) return NextResponse.json({ error: "file required" }, { status: 400 });

  const resolved = resolveRepoFilePath(filePath, EDITABLE_PREFIXES);
  if (!resolved) return NextResponse.json({ error: "허용되지 않는 경로" }, { status: 400 });
  if (!fs.existsSync(resolved.absPath)) return NextResponse.json({ error: "not found" }, { status: 404 });

  try {
    const raw = fs.readFileSync(resolved.absPath, "utf-8");
    const { data, content } = matter(raw);
    return NextResponse.json({ frontmatter: data, body: content.trim() });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST: frontmatter + body 저장 (newSlug로 파일명 변경 가능)
export async function POST(req: Request) {
  try {
    const { file, frontmatter, body, newSlug } = await req.json();
    const resolved = resolveRepoFilePath(file, EDITABLE_PREFIXES);
    if (!resolved) return NextResponse.json({ error: "허용되지 않는 경로" }, { status: 400 });
    const absPath = resolved.absPath;
    if (!fs.existsSync(absPath)) return NextResponse.json({ error: "not found" }, { status: 404 });

    const frontmatterYaml = serializeFrontmatter(frontmatter);
    const content = frontmatterYaml + "\n\n" + (body || "").trim() + "\n";

    // slug 변경 시 파일명 rename
    const currentSlug = path.basename(file, path.extname(file));
    if (newSlug && newSlug !== currentSlug) {
      if (!isValidSlug(newSlug)) return NextResponse.json({ error: "허용되지 않는 slug" }, { status: 400 });
      const dir = path.dirname(absPath);
      const ext = path.extname(file);
      const newAbsPath = path.join(dir, `${newSlug}${ext}`);
      if (fs.existsSync(newAbsPath)) return NextResponse.json({ error: "같은 이름의 파일이 이미 존재합니다" }, { status: 400 });
      fs.writeFileSync(absPath, content, "utf-8");
      fs.renameSync(absPath, newAbsPath);
      const newFile = file.replace(`${currentSlug}${ext}`, `${newSlug}${ext}`);
      return NextResponse.json({ success: true, renamed: true, newFile });
    }

    fs.writeFileSync(absPath, content, "utf-8");
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// DELETE: 콘텐츠 파일 삭제 (files 배열로 여러 파일 삭제 가능)
export async function DELETE(req: Request) {
  try {
    const { files } = await req.json() as { files: string[] };
    const deleted: string[] = [];
    const errors: string[] = [];

    for (const file of files) {
      const resolved = resolveRepoFilePath(file, DELETABLE_PREFIXES);
      if (!resolved) {
        errors.push(`${file}: 허용되지 않는 경로`);
        continue;
      }
      if (!fs.existsSync(resolved.absPath)) {
        errors.push(`${file}: 파일 없음`);
        continue;
      }
      fs.unlinkSync(resolved.absPath);
      deleted.push(resolved.repoPath);
    }

    if (deleted.length === 0) {
      return NextResponse.json({ error: errors.join(", ") || "삭제할 파일이 없습니다" }, { status: 400 });
    }

    return NextResponse.json({ success: true, deleted, errors: errors.length > 0 ? errors : undefined });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// PUT: 컬렉션 간 파일 이동
export async function PUT(req: Request) {
  try {
    const { fromFile, toCollection } = await req.json();
    const fromResolved = resolveRepoFilePath(fromFile, EDITABLE_PREFIXES);
    if (!fromResolved) return NextResponse.json({ error: "허용되지 않는 경로" }, { status: 400 });
    if (!isAllowedCollection(toCollection)) return NextResponse.json({ error: "허용되지 않는 collection" }, { status: 400 });
    if (!fs.existsSync(fromResolved.absPath)) return NextResponse.json({ error: "source not found" }, { status: 404 });

    const filename = path.basename(fromFile);
    const toDir = path.join(process.cwd(), "content", toCollection);
    const toAbs = path.join(toDir, filename);

    if (fs.existsSync(toAbs)) return NextResponse.json({ error: "target already exists" }, { status: 400 });

    fs.mkdirSync(toDir, { recursive: true });
    fs.renameSync(fromResolved.absPath, toAbs);

    return NextResponse.json({ success: true, newPath: `content/${toCollection}/${filename}` });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
