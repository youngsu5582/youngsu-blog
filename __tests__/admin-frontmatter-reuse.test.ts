import fs from "fs";
import { describe, expect, it } from "vitest";

describe("admin frontmatter serialization reuse", () => {
  it("translate/save uses shared serializeFrontmatter instead of hand-built YAML lines", () => {
    const source = fs.readFileSync("app/api/admin/translate/save/route.ts", "utf-8");

    expect(source).toContain("serializeFrontmatter");
    expect(source).not.toContain('const lines = ["---"]');
    expect(source).not.toContain("Object.entries(enFrontmatter)");
  });

  it("obsidian import uses shared serializeFrontmatter instead of hand-built YAML lines", () => {
    const source = fs.readFileSync("app/api/admin/obsidian/route.ts", "utf-8");

    expect(source).toContain("serializeFrontmatter");
    expect(source).not.toContain('const lines = ["---"]');
    expect(source).not.toContain("lines.push(`title:");
  });
});
