import path from "path";

export const ALLOWED_COLLECTIONS = new Set(["posts", "articles", "notes", "library"]);
export const ALLOWED_GENERATED_PREFIXES = ["content/", "public/assets/img/"];

export function isAllowedCollection(collection: string): boolean {
  return ALLOWED_COLLECTIONS.has(collection);
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9가-힣-]+$/.test(slug) && !slug.includes("..") && !slug.includes("/") && !slug.includes("\\");
}

export function normalizeRepoRelativePath(filePath: string): string | null {
  const normalized = filePath.replace(/\\/g, "/").replace(/^\.\//, "");
  if (path.isAbsolute(normalized)) return null;

  const parts = normalized.split("/");
  if (parts.some((part) => part === ".." || part === "")) return null;

  return normalized;
}

export function buildContentFilePath(collection: string, slug: string): { contentDir: string; absPath: string; repoPath: string } | null {
  if (!isAllowedCollection(collection) || !isValidSlug(slug)) return null;

  const repoPath = `content/${collection}/${slug}.mdx`;
  const root = path.resolve(process.cwd(), "content");
  const absPath = path.resolve(process.cwd(), repoPath);
  if (!absPath.startsWith(root + path.sep)) return null;

  return {
    contentDir: path.dirname(absPath),
    absPath,
    repoPath,
  };
}

export function isAllowedGeneratedPath(filePath: string): boolean {
  const normalized = normalizeRepoRelativePath(filePath);
  return !!normalized && ALLOWED_GENERATED_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

export function resolveRepoFilePath(filePath: string, allowedPrefixes: string[]): { repoPath: string; absPath: string } | null {
  const repoPath = normalizeRepoRelativePath(filePath);
  if (!repoPath || !allowedPrefixes.some((prefix) => repoPath.startsWith(prefix))) return null;

  const absPath = path.resolve(process.cwd(), repoPath);
  if (!absPath.startsWith(process.cwd() + path.sep)) return null;

  return { repoPath, absPath };
}
