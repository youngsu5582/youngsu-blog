/**
 * Jekyll → Next.js (Velite) 포스트 마이그레이션 스크립트
 *
 * 사용법:
 *   npx tsx scripts/migrate-posts.ts              # 전체 마이그레이션
 *   npx tsx scripts/migrate-posts.ts --limit 10   # 첫 10개만
 *   npx tsx scripts/migrate-posts.ts --dry-run    # 미리보기 (파일 생성 안 함)
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";

// === Config ===
const JEKYLL_ROOT = path.resolve(__dirname, "../../blog");
const NEXTJS_ROOT = path.resolve(__dirname, "..");
const POSTS_SRC = path.join(JEKYLL_ROOT, "_posts");
const POSTS_DEST = path.join(NEXTJS_ROOT, "content/posts");
const ARTICLES_SRC = path.join(JEKYLL_ROOT, "_articles");
const ARTICLES_DEST = path.join(NEXTJS_ROOT, "content/articles");
const LIBRARY_SRC = path.join(JEKYLL_ROOT, "_library");
const LIBRARY_DEST = path.join(NEXTJS_ROOT, "content/library");

// === CLI args ===
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const limitIdx = args.indexOf("--limit");
const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : Infinity;
const koOnly = !args.includes("--include-en");
const collection = args.find((a) => a.startsWith("--collection="))?.split("=")[1] || "posts";

// === Helpers ===

function findFiles(dir: string, ext = ".md"): string[] {
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

function extractSlugFromPermalink(permalink: string): string | null {
  // /posts/some-slug/ → some-slug
  const match = permalink.match(/\/posts\/([^/]+)\/?$/);
  return match ? match[1] : null;
}

function extractSlugFromFilename(filename: string): string {
  // 2024-04-13-dont-leave-room-for-mistakes-ko.md → dont-leave-room-for-mistakes
  let slug = path.basename(filename, ".md");
  // Remove date prefix
  slug = slug.replace(/^\d{4}-\d{2}-\d{2}-/, "");
  // Remove language suffix
  slug = slug.replace(/-(ko|en)$/, "");
  return slug;
}

function formatDate(date: string | Date | undefined, filename: string): string {
  if (date) {
    const d = new Date(date);
    if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  }
  // Fallback: extract from filename (YYYY-MM-DD-...)
  const match = filename.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  // Last fallback: today
  return new Date().toISOString().split("T")[0];
}

function convertImagePath(imagePath: string | undefined): string | undefined {
  if (!imagePath) return undefined;
  // assets/img/... → /images/...
  if (imagePath.startsWith("assets/img/")) {
    return "/" + imagePath;
  }
  // External URLs: keep as-is
  if (imagePath.startsWith("http")) {
    return imagePath;
  }
  return imagePath;
}

/**
 * CSS property name을 camelCase로 변환 (e.g., margin-right → marginRight)
 */
function cssToCamelCase(prop: string): string {
  return prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * HTML style="..." 를 JSX style={{...}} 로 변환
 */
function convertHtmlStyleToJsx(line: string): string {
  return line.replace(/style="([^"]+)"/g, (_, css: string) => {
    const pairs = css.split(";").filter(Boolean).map((pair: string) => {
      const [prop, ...valParts] = pair.split(":");
      const val = valParts.join(":").trim();
      const camelProp = cssToCamelCase(prop.trim());
      return `${camelProp}: "${val}"`;
    });
    return `style={{${pairs.join(", ")}}}`;
  });
}

/**
 * MDX 호환성을 위해 본문 내 JSX-breaking 패턴을 이스케이프
 * - 코드 블록 밖의 `<->`, `<>`, `< ` 등 비정상 HTML을 `\<` 로 변환
 * - HTML style="..." → JSX style={{...}} 변환
 */
function escapeMdxBody(content: string): string {
  const lines = content.split("\n");
  let inCodeBlock = false;

  return lines.map((line) => {
    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      return line;
    }
    if (inCodeBlock) return line;

    // Convert HTML style attributes to JSX
    line = convertHtmlStyleToJsx(line);

    // Escape `<` that is NOT a valid HTML/JSX tag start
    // Valid: <div, <br, <Component, <span — starts with letter
    // Invalid: <->, <>, < space, <123
    return line.replace(/<(?![a-zA-Z/!])/g, "\\<");
  }).join("\n");
}

function buildFrontmatter(data: Record<string, unknown>): string {
  const lines: string[] = ["---"];

  const addField = (key: string, value: unknown) => {
    if (value === undefined || value === null) return;
    if (typeof value === "string") {
      // Escape quotes in YAML
      if (value.includes(":") || value.includes("#") || value.includes('"') || value.includes("'") || value.startsWith("{") || value.startsWith("[")) {
        lines.push(`${key}: "${value.replace(/"/g, '\\"')}"`);
      } else {
        lines.push(`${key}: ${value}`);
      }
    } else if (typeof value === "boolean" || typeof value === "number") {
      lines.push(`${key}: ${value}`);
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${key}: []`);
      } else {
        lines.push(`${key}:`);
        value.forEach((v) => {
          // Quote numeric values to prevent YAML parsing as numbers
          const str = String(v);
          if (/^\d+$/.test(str)) {
            lines.push(`  - "${str}"`);
          } else {
            lines.push(`  - ${str}`);
          }
        });
      }
    }
  };

  addField("title", data.title);
  addField("date", data.date);
  addField("description", data.description);
  addField("categories", data.categories);
  addField("tags", data.tags);
  if (data.image) addField("image", data.image);
  addField("author", data.author);
  if (data.lang && data.lang !== "ko") addField("lang", data.lang);
  if (data.draft) addField("draft", data.draft);
  // Article-specific
  if (data.moc) addField("moc", data.moc);
  if (data.status) addField("status", data.status);
  if (data.subTopic) addField("subTopic", data.subTopic);
  // Library-specific
  if (data.mediaType) addField("mediaType", data.mediaType);
  if (data.rating) addField("rating", data.rating);

  lines.push("---");
  return lines.join("\n");
}

// === Migration ===

interface MigrationResult {
  source: string;
  dest: string;
  slug: string;
  title: string;
  status: "ok" | "skip" | "error";
  reason?: string;
}

/**
 * YAML frontmatter에서 중복 키를 제거
 */
function removeDuplicateKeys(raw: string): string {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return raw;

  const frontmatter = match[1];
  const seen = new Set<string>();
  const lines: string[] = [];

  for (const line of frontmatter.split("\n")) {
    // Top-level key (not indented, has colon)
    const keyMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*):/);
    if (keyMatch) {
      const key = keyMatch[1];
      if (seen.has(key)) continue; // skip duplicate
      seen.add(key);
    }
    lines.push(line);
  }

  return raw.replace(/^---\n[\s\S]*?\n---/, `---\n${lines.join("\n")}\n---`);
}

function migratePost(filePath: string, destDir: string, collectionType: string): MigrationResult {
  const rawOriginal = fs.readFileSync(filePath, "utf-8");
  const raw = removeDuplicateKeys(rawOriginal);
  const { data, content } = matter(raw);

  // Determine language
  const filename = path.basename(filePath);
  const isKo = filename.endsWith("-ko.md");
  const isEn = filename.endsWith("-en.md");
  const lang = isEn ? "en" : "ko";

  // Skip English if koOnly
  if (koOnly && isEn) {
    return { source: filePath, dest: "", slug: "", title: data.title || "", status: "skip", reason: "en (koOnly)" };
  }

  // Determine slug
  let slug: string;
  if (data.permalink) {
    slug = extractSlugFromPermalink(data.permalink) || extractSlugFromFilename(filename);
  } else {
    slug = extractSlugFromFilename(filename);
  }

  // For English posts, add -en suffix
  const destSlug = isEn ? `${slug}-en` : slug;
  const destPath = path.join(destDir, `${destSlug}.mdx`);

  // Check if already exists
  if (fs.existsSync(destPath)) {
    return { source: filePath, dest: destPath, slug: destSlug, title: data.title, status: "skip", reason: "already exists" };
  }

  // Convert frontmatter
  const converted: Record<string, unknown> = {
    title: data.title,
    date: formatDate(data.date, path.basename(filePath)),
    description: data.description || "",
    categories: Array.isArray(data.categories) ? data.categories : data.categories ? [data.categories] : [],
    tags: Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags] : [],
    image: convertImagePath(data.image?.path || data.image),
    author: data.author || "이영수",
    lang: lang,
  };

  // Collection-specific fields
  if (collectionType === "articles") {
    converted.moc = data.moc;
    converted.status = data.status || "seed";
    converted.subTopic = data.subTopic;
  }
  if (collectionType === "library") {
    converted.mediaType = data.media_type || data.mediaType || "book";
    converted.rating = data.rating;
  }

  // Build output
  const frontmatter = buildFrontmatter(converted);
  const escapedContent = escapeMdxBody(content.trim());
  const output = `${frontmatter}\n\n${escapedContent}\n`;

  if (!dryRun) {
    fs.mkdirSync(destDir, { recursive: true });
    fs.writeFileSync(destPath, output, "utf-8");
  }

  return { source: filePath, dest: destPath, slug: destSlug, title: data.title, status: "ok" };
}

// === Main ===

function main() {
  console.log(`\n📦 Jekyll → Next.js 마이그레이션`);
  console.log(`   Collection: ${collection}`);
  console.log(`   Limit: ${limit === Infinity ? "전체" : limit}`);
  console.log(`   Dry run: ${dryRun}`);
  console.log(`   Korean only: ${koOnly}\n`);

  let srcDir: string;
  let destDir: string;

  switch (collection) {
    case "articles":
      srcDir = ARTICLES_SRC;
      destDir = ARTICLES_DEST;
      break;
    case "library":
      srcDir = LIBRARY_SRC;
      destDir = LIBRARY_DEST;
      break;
    default:
      srcDir = POSTS_SRC;
      destDir = POSTS_DEST;
  }

  const files = findFiles(srcDir);
  console.log(`📂 발견된 파일: ${files.length}개\n`);

  const results: MigrationResult[] = [];
  let processed = 0;

  for (const file of files) {
    if (processed >= limit) break;

    try {
      const result = migratePost(file, destDir, collection);
      results.push(result);

      if (result.status === "ok") {
        processed++;
        console.log(`  ✅ ${result.slug} — ${result.title}`);
      } else if (result.status === "skip") {
        console.log(`  ⏭️  skip: ${path.basename(file)} (${result.reason})`);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      results.push({
        source: file,
        dest: "",
        slug: "",
        title: "",
        status: "error",
        reason: errMsg,
      });
      console.log(`  ❌ error: ${path.basename(file)} — ${errMsg}`);
    }
  }

  // Summary
  const ok = results.filter((r) => r.status === "ok").length;
  const skipped = results.filter((r) => r.status === "skip").length;
  const errors = results.filter((r) => r.status === "error").length;

  console.log(`\n📊 결과: ${ok} 성공 / ${skipped} 스킵 / ${errors} 에러`);

  if (dryRun) {
    console.log(`\n💡 --dry-run 모드입니다. 실제 파일은 생성되지 않았습니다.`);
  }
}

main();
