/**
 * 콘텐츠 검증 스크립트
 * - Frontmatter 필수 필드 체크
 * - 이미지 경로 존재 확인
 * - 코드 블록 열림/닫힘 체크
 *
 * 사용법:
 *   npx tsx scripts/validate-content.ts
 *   npx tsx scripts/validate-content.ts --fix   # 자동 수정 가능한 것만
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = path.resolve(__dirname, "../content");
const PUBLIC_DIR = path.resolve(__dirname, "../public");

interface Issue {
  file: string;
  level: "error" | "warn";
  message: string;
}

const issues: Issue[] = [];

function addIssue(file: string, level: "error" | "warn", message: string) {
  issues.push({ file, level, message });
}

function findFiles(dir: string, ext: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  function walk(d: string) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(ext)) results.push(full);
    }
  }
  walk(dir);
  return results.sort();
}

// === Validators ===

function validateFrontmatter(filePath: string, collection: string) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data } = matter(raw);
  const rel = path.relative(CONTENT_DIR, filePath);

  // Required fields
  if (!data.title) addIssue(rel, "error", "title 필드 누락");
  if (!data.date) addIssue(rel, "error", "date 필드 누락");

  // Date format
  if (data.date) {
    const d = new Date(data.date);
    if (isNaN(d.getTime())) addIssue(rel, "error", `유효하지 않은 날짜: ${data.date}`);
  }

  // Categories should be array
  if (data.categories && !Array.isArray(data.categories)) {
    addIssue(rel, "warn", "categories가 배열이 아님");
  }

  // Tags should be array
  if (data.tags && !Array.isArray(data.tags)) {
    addIssue(rel, "warn", "tags가 배열이 아님");
  }

  // Image path check
  if (data.image && typeof data.image === "string") {
    if (data.image.startsWith("/") && !data.image.startsWith("http")) {
      const imgPath = path.join(PUBLIC_DIR, data.image);
      if (!fs.existsSync(imgPath)) {
        addIssue(rel, "warn", `이미지 파일 없음: ${data.image}`);
      }
    }
  }

  // Collection-specific
  if (collection === "library") {
    if (!data.mediaType && !data.media_type) {
      addIssue(rel, "warn", "mediaType 필드 누락 (book/movie)");
    }
  }
}

function validateMdxBody(filePath: string) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { content } = matter(raw);
  const rel = path.relative(CONTENT_DIR, filePath);
  const lines = content.split("\n");

  // Check code block pairing
  let inCodeBlock = false;
  let codeBlockStart = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith("```")) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockStart = i + 1;
      } else {
        inCodeBlock = false;
      }
    }
  }
  if (inCodeBlock) {
    addIssue(rel, "error", `코드 블록이 닫히지 않음 (line ${codeBlockStart}에서 시작)`);
  }

  // Check for problematic MDX patterns outside code blocks
  inCodeBlock = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // HTML style attributes (should be JSX format)
    if (/style="[^"]*"/.test(lines[i])) {
      addIssue(rel, "warn", `HTML style 속성 발견 (line ${i + 1}) — JSX 형식 필요`);
    }
  }
}

// === Main ===

function main() {
  console.log("\n🔍 콘텐츠 검증 시작\n");

  const collections = [
    { name: "posts", dir: path.join(CONTENT_DIR, "posts") },
    { name: "articles", dir: path.join(CONTENT_DIR, "articles") },
    { name: "library", dir: path.join(CONTENT_DIR, "library") },
  ];

  let totalFiles = 0;

  for (const col of collections) {
    const files = findFiles(col.dir, ".mdx");
    totalFiles += files.length;
    console.log(`📂 ${col.name}: ${files.length}개 파일`);

    for (const file of files) {
      validateFrontmatter(file, col.name);
      validateMdxBody(file);
    }
  }

  console.log(`\n📊 검사 완료: ${totalFiles}개 파일\n`);

  // Print results
  const errors = issues.filter((i) => i.level === "error");
  const warns = issues.filter((i) => i.level === "warn");

  if (errors.length > 0) {
    console.log("❌ 에러:");
    errors.forEach((i) => console.log(`  ${i.file}: ${i.message}`));
  }

  if (warns.length > 0) {
    console.log("\n⚠️  경고:");
    warns.forEach((i) => console.log(`  ${i.file}: ${i.message}`));
  }

  if (issues.length === 0) {
    console.log("✅ 모든 콘텐츠가 정상입니다!");
  }

  console.log(`\n합계: ${errors.length} 에러 / ${warns.length} 경고\n`);

  // Exit with error code if errors found
  if (errors.length > 0) process.exit(1);
}

main();
