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
});
