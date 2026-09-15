import path from "path";

/**
 * Mutable checkout used by the Admin editor and Git/PR operations.
 *
 * The Next.js runtime and its `.next` output can live in an immutable image
 * while the editable Blog checkout is mounted separately at this path.
 */
export const BLOG_REPO_ROOT = path.resolve(process.env.BLOG_REPO_ROOT || process.cwd());
