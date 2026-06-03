import fs from "fs";
import { describe, expect, it } from "vitest";

describe("admin bulk edit route path safety", () => {
  const source = fs.readFileSync("app/api/admin/bulk-edit/route.ts", "utf-8");

  it("normalizes each edited file through shared content path validation", () => {
    expect(source).toContain("resolveRepoFilePath");
    expect(source).toContain("[\"content/\"]");
    expect(source).not.toContain("path.join(process.cwd(), filePath)");
    expect(source).not.toContain("const CONTENT_DIR");
  });
});
