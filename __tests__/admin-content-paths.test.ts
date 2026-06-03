import path from "path";
import { describe, expect, it } from "vitest";

import {
  buildContentFilePath,
  isAllowedCollection,
  isValidSlug,
  normalizeRepoRelativePath,
  resolveRepoFilePath,
} from "@/lib/admin-content-paths";

describe("admin content path helpers", () => {
  it("accepts only known content collections", () => {
    expect(isAllowedCollection("posts")).toBe(true);
    expect(isAllowedCollection("articles")).toBe(true);
    expect(isAllowedCollection("../../secrets")).toBe(false);
    expect(isAllowedCollection("public")).toBe(false);
  });

  it("rejects slugs that can escape the expected mdx filename", () => {
    expect(isValidSlug("safe-post-123")).toBe(true);
    expect(isValidSlug("한글-글-123")).toBe(true);
    expect(isValidSlug("../secret")).toBe(false);
    expect(isValidSlug("nested/post")).toBe(false);
    expect(isValidSlug("has space")).toBe(false);
    expect(isValidSlug("UPPERCASE")).toBe(false);
  });

  it("builds content paths only under the content root", () => {
    const built = buildContentFilePath("posts", "safe-post");

    expect(built?.repoPath).toBe("content/posts/safe-post.mdx");
    expect(built?.absPath).toBe(path.join(process.cwd(), "content/posts/safe-post.mdx"));
    expect(buildContentFilePath("../../outside", "safe-post")).toBeNull();
    expect(buildContentFilePath("posts", "../outside")).toBeNull();
  });

  it("normalizes repo relative paths without allowing traversal or absolute paths", () => {
    expect(normalizeRepoRelativePath("./content/posts/a.mdx")).toBe("content/posts/a.mdx");
    expect(normalizeRepoRelativePath("content\\posts\\a.mdx")).toBe("content/posts/a.mdx");
    expect(normalizeRepoRelativePath("/etc/passwd")).toBeNull();
    expect(normalizeRepoRelativePath("content/../package.json")).toBeNull();
  });

  it("resolves only files below explicitly allowed repo prefixes", () => {
    expect(resolveRepoFilePath("content/posts/a.mdx", ["content/"])?.repoPath).toBe("content/posts/a.mdx");
    expect(resolveRepoFilePath("public/assets/img/a.png", ["public/assets/img/"])?.repoPath).toBe("public/assets/img/a.png");
    expect(resolveRepoFilePath("package.json", ["content/"])).toBeNull();
    expect(resolveRepoFilePath("../outside", ["content/"])).toBeNull();
  });
});
