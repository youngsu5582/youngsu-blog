import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

describe("admin edit route safety", () => {
  it("uses shared repo path validation instead of joining raw user file paths", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app/api/admin/edit/route.ts"), "utf-8");

    expect(source).toContain("resolveRepoFilePath");
    expect(source).toContain("isValidSlug");
    expect(source).toContain("isAllowedCollection");
    expect(source).not.toContain("path.join(cwd, file)");
    expect(source).not.toContain("path.join(cwd, fromFile)");
  });
});
