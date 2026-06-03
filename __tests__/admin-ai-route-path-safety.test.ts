import fs from "fs";
import { describe, expect, it } from "vitest";

const routes = [
  "app/api/admin/ai/suggest/route.ts",
  "app/api/admin/ai/review/route.ts",
  "app/api/admin/translate/route.ts",
];

describe("admin AI route content path safety", () => {
  it.each(routes)("%s resolves content files through shared repo path validation", (route) => {
    const source = fs.readFileSync(route, "utf-8");

    expect(source).toContain("resolveRepoFilePath");
    expect(source).toContain("[\"content/\"]");
    expect(source).not.toContain("path.join(process.cwd(), filePath)");
    expect(source).not.toContain("import path from \"path\"");
  });
});
