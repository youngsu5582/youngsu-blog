/**
 * 포스트 번역 스크립트 (Google Cloud Translate)
 *
 * 사용법:
 *   npx tsx scripts/translate-post.ts content/posts/my-post.mdx
 *
 * 환경변수:
 *   GOOGLE_API_KEY — Google Cloud Translation API 키
 *
 * 출력: content/posts/my-post-en.mdx
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";

const filePath = process.argv[2];

if (!filePath) {
  console.error("사용법: npx tsx scripts/translate-post.ts <file.mdx>");
  process.exit(1);
}

const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  console.error("❌ GOOGLE_API_KEY 환경변수가 설정되지 않았습니다.");
  console.error("   export GOOGLE_API_KEY=your-key 또는 .env 파일에 추가하세요.");
  process.exit(1);
}

async function translateText(text: string, target = "en"): Promise<string> {
  const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: text, target, format: "text" }),
  });

  if (!res.ok) {
    throw new Error(`Translation API error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.data.translations[0].translatedText;
}

async function main() {
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    console.error(`❌ 파일을 찾을 수 없습니다: ${filePath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(absPath, "utf-8");
  const { data, content } = matter(raw);

  console.log(`📝 번역 시작: ${data.title}`);

  // Split content into chunks (code blocks preserved)
  const chunks: { text: string; isCode: boolean }[] = [];
  const lines = content.split("\n");
  let inCode = false;
  let buffer: string[] = [];

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      if (buffer.length > 0) {
        chunks.push({ text: buffer.join("\n"), isCode: inCode });
        buffer = [];
      }
      inCode = !inCode;
      buffer.push(line);
    } else {
      buffer.push(line);
    }
  }
  if (buffer.length > 0) {
    chunks.push({ text: buffer.join("\n"), isCode: inCode });
  }

  // Translate non-code chunks
  const translated: string[] = [];
  for (const chunk of chunks) {
    if (chunk.isCode || chunk.text.trim() === "") {
      translated.push(chunk.text);
    } else {
      console.log(`  번역 중... (${chunk.text.length}자)`);
      const result = await translateText(chunk.text);
      translated.push(result);
    }
  }

  // Translate frontmatter
  const enTitle = await translateText(data.title);
  const enDesc = data.description ? await translateText(data.description) : "";

  // Build output
  const enData: Record<string, unknown> = {
    ...data,
    title: enTitle,
    description: enDesc,
    lang: "en",
  };

  const enFrontmatter = ["---"];
  for (const [key, val] of Object.entries(enData)) {
    if (Array.isArray(val)) {
      if (val.length === 0) {
        enFrontmatter.push(`${key}: []`);
      } else {
        enFrontmatter.push(`${key}:`);
        val.forEach((v) => enFrontmatter.push(`  - ${v}`));
      }
    } else if (val !== undefined && val !== null) {
      enFrontmatter.push(`${key}: ${val}`);
    }
  }
  enFrontmatter.push("---");

  const output = enFrontmatter.join("\n") + "\n\n" + translated.join("\n") + "\n";

  // Write output
  const outPath = absPath.replace(/\.mdx$/, "-en.mdx");
  fs.writeFileSync(outPath, output, "utf-8");
  console.log(`\n✅ 번역 완료: ${path.relative(process.cwd(), outPath)}`);
}

main().catch((err) => {
  console.error("❌ 번역 실패:", err.message);
  process.exit(1);
});
