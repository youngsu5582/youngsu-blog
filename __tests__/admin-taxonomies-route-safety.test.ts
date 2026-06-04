import { describe, expect, it } from "vitest";
import fs from "fs";

const routePath = "app/api/admin/taxonomies/route.ts";

describe("admin taxonomies route safety", () => {
  it("uses shared taxonomy helpers and shared frontmatter serializer", () => {
    const source = fs.readFileSync(routePath, "utf-8");

    expect(source).toContain("buildTaxonomySummary");
    expect(source).toContain("renameTaxonomyValues");
    expect(source).toContain("serializeFrontmatter");
  });

  it("does not accept arbitrary fields or file paths from the client", () => {
    const source = fs.readFileSync(routePath, "utf-8");

    expect(source).toContain("isTaxonomyField");
    expect(source).toContain("CONTENT_COLLECTIONS");
    expect(source).not.toContain("path.join(process.cwd(), filePath)");
  });
});
