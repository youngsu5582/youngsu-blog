import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

describe("admin write route safety", () => {
  it("uses shared frontmatter serialization instead of interpolated YAML lines", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app/api/admin/write/route.ts"), "utf-8");

    expect(source).toContain("serializeFrontmatter");
    expect(source).not.toMatch(/lines\.push\(`title:/);
    expect(source).not.toMatch(/lines\.push\(`description:/);
  });

  it("validates collection and slug before constructing a content file path", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app/api/admin/write/route.ts"), "utf-8");

    expect(source).toContain("buildContentFilePath");
    expect(source).not.toContain("path.join(process.cwd(), \"content\", collection)");
  });
});
