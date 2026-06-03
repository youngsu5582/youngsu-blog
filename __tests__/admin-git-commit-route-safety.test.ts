import fs from "fs";
import { describe, expect, it } from "vitest";

describe("admin git commit route safety", () => {
  const source = fs.readFileSync("app/api/admin/git/commit/route.ts", "utf-8");

  it("uses execFileSync argv calls instead of shell-interpolated git commands", () => {
    expect(source).toContain("execFileSync");
    expect(source).not.toContain("execSync(`git add");
    expect(source).not.toContain("execSync(`git commit");
    expect(source).toContain("[\"add\", \"--\"");
    expect(source).toContain("[\"commit\", \"-F\"");
  });

  it("does not fall back to git add -A when no explicit allowlisted file list is provided", () => {
    expect(source).not.toContain("git add -A");
    expect(source).toContain("files must be a non-empty array");
    expect(source).toContain("normalizeRepoRelativePath");
  });
});
