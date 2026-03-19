import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = path.resolve(__dirname, "../content");

function findMdxFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findMdxFiles(full));
    else if (entry.name.endsWith(".mdx")) results.push(full);
  }
  return results;
}

describe("콘텐츠 검증", () => {
  const postFiles = findMdxFiles(path.join(CONTENT_DIR, "posts"));
  const articleFiles = findMdxFiles(path.join(CONTENT_DIR, "articles"));
  const libraryFiles = findMdxFiles(path.join(CONTENT_DIR, "library"));
  const noteFiles = findMdxFiles(path.join(CONTENT_DIR, "notes"));

  it("포스트가 존재한다", () => {
    expect(postFiles.length).toBeGreaterThan(0);
  });

  describe("포스트 frontmatter", () => {
    postFiles.forEach((file) => {
      const rel = path.relative(CONTENT_DIR, file);
      it(`${rel}: 필수 필드가 있다`, () => {
        const raw = fs.readFileSync(file, "utf-8");
        const { data } = matter(raw);
        expect(data.title).toBeDefined();
        expect(data.date).toBeDefined();
      });
    });
  });

  describe("파일명에 한글이 없다", () => {
    const allFiles = [...postFiles, ...articleFiles, ...libraryFiles, ...noteFiles];
    allFiles.forEach((file) => {
      const basename = path.basename(file);
      it(`${basename}: 영문 slug`, () => {
        expect(/[가-힣]/.test(basename)).toBe(false);
      });
    });
  });

  describe("코드 블록 페어링", () => {
    postFiles.slice(0, 20).forEach((file) => {
      const rel = path.relative(CONTENT_DIR, file);
      it(`${rel}: 코드 블록이 올바르게 닫힌다`, () => {
        const raw = fs.readFileSync(file, "utf-8");
        const { content } = matter(raw);
        const backtickCount = (content.match(/^```/gm) || []).length;
        expect(backtickCount % 2).toBe(0);
      });
    });
  });
});
