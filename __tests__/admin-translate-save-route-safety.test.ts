import fs from "fs";
import { describe, expect, it } from "vitest";

describe("admin translate save route safety", () => {
  const source = fs.readFileSync("app/api/admin/translate/save/route.ts", "utf-8");

  it("기존 영어 번역본은 명시적 overwrite 없이는 저장하지 않는다", () => {
    expect(source).toContain("overwrite");
    expect(source).toContain("이미 영어 번역본이 있습니다");
    expect(source).toContain("status: 409");
    expect(source).toContain("overwrite !== true");
  });

  it("원본/번역 저장 경로를 content 컬렉션 allowlist와 repo-relative resolver로 검증한다", () => {
    expect(source).toContain("resolveRepoFilePath");
    expect(source).toContain("ALLOWED_TRANSLATION_PREFIXES");
    expect(source).toContain('"content/posts/"');
    expect(source).toContain('"content/articles/"');
    expect(source).toContain('"content/notes/"');
    expect(source).toContain('"content/library/"');
    expect(source).toContain("resolveTranslationTargetPath");
    expect(source).toContain("잘못된 원본 파일 경로입니다");
    expect(source).not.toContain("path.join(process.cwd(), originalPath)");
    expect(source).not.toContain("path.join(process.cwd(), enFilePath)");
  });
});
