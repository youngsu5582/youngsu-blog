import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

describe("admin publish route safety", () => {
  it("git/gh commands use execFileSync args instead of interpolated shell strings", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app/api/admin/publish/route.ts"), "utf-8");

    expect(source).toContain("execFileSync");
    expect(source).not.toMatch(/execSync\(`git /);
    expect(source).not.toMatch(/execSync\(`gh /);
    expect(source).not.toMatch(/git add \"\$\{f\}\"/);
  });

  it("generatedFiles are normalized before they can enter filesToCommit", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app/api/admin/publish/route.ts"), "utf-8");

    expect(source).toContain("normalizeGeneratedFile");
    expect(source).toContain("isAllowedGeneratedPath");
    expect(source).toContain("buildContentFilePath");
    expect(source).not.toMatch(/filesToCommit\.push\(genFile\)/);
  });

  it("publishes from origin/main instead of the currently checked out branch", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app/api/admin/publish/route.ts"), "utf-8");

    expect(source).toContain('git(["fetch", "origin", "main"], cwd)');
    expect(source).toContain('git(["worktree", "add", "--detach", worktreePath, "origin/main"], cwd)');
    expect(source).toContain('git(["push", "origin", "HEAD:main"], worktreePath)');
    expect(source).not.toContain('git(["push", "origin", "main"], cwd)');
  });

  it("returns an unsuccessful response when the direct push cannot be completed", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app/api/admin/publish/route.ts"), "utf-8");

    expect(source).toContain('phase: "push"');
    expect(source).toContain("커밋은 생성됐지만 origin/main 푸시에 실패했습니다");
    expect(source).toContain("status: 409");
  });
});
