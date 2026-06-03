import fs from "fs";
import { describe, expect, it } from "vitest";

describe("admin obsidian import route safety", () => {
  const source = fs.readFileSync("app/api/admin/obsidian/route.ts", "utf-8");
  const pageSource = fs.readFileSync("app/admin/obsidian/page.tsx", "utf-8");

  it("검증된 vault root 안의 markdown 파일만 import 대상으로 허용한다", () => {
    expect(source).toContain("resolveVaultDirectory");
    expect(source).toContain("resolveVaultMarkdownFile");
    expect(source).toContain("path.resolve(vaultRoot, filePath)");
    expect(source).toContain("startsWith(vaultRoot + path.sep)");
    expect(source).toContain(".md 파일만 가져올 수 있습니다");
    expect(source).not.toContain("fs.existsSync(filePath)");
    expect(source).not.toContain("fs.readFileSync(filePath");
  });

  it("targetCollection은 공통 allowlist와 content path builder를 사용한다", () => {
    expect(source).toContain("isAllowedCollection");
    expect(source).toContain("buildContentFilePath");
    expect(source).toContain("generateSlug(inputFile.filename)");
    expect(source).not.toContain('["posts", "articles", "notes", "library"].includes');
    expect(source).not.toContain('path.join(process.cwd(), "content", targetCollection)');
  });

  it("import 요청에는 vaultPath를 같이 보내서 서버가 선택 파일의 루트를 재검증한다", () => {
    expect(pageSource).toContain("vaultPath");
    expect(pageSource).toContain("files: Array.from(selectedFiles)");
    expect(pageSource).toContain("targetCollection");
  });
});
