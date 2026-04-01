import fs from "fs";
import matter from "gray-matter";

/**
 * Serialize frontmatter data to YAML format
 * Handles arrays, booleans, numbers, and strings with proper escaping
 */
export function serializeFrontmatter(data: Record<string, unknown>): string {
  const lines = ["---"];

  for (const [key, val] of Object.entries(data)) {
    if (val === undefined || val === null) continue;

    if (Array.isArray(val)) {
      if (val.length === 0) {
        lines.push(`${key}: []`);
      } else {
        lines.push(`${key}:`);
        val.forEach((v: string) => {
          const str = String(v);
          // Escape numeric strings to preserve them as strings
          lines.push(/^\d+$/.test(str) ? `  - "${str}"` : `  - ${str}`);
        });
      }
    } else if (typeof val === "boolean" || typeof val === "number") {
      lines.push(`${key}: ${val}`);
    } else {
      const str = String(val);
      // Escape strings that contain special YAML characters
      if (str.includes(":") || str.includes("#") || str.includes('"') || str.includes("'")) {
        lines.push(`${key}: "${str.replace(/"/g, '\\"')}"`);
      } else {
        lines.push(`${key}: ${str}`);
      }
    }
  }

  lines.push("---");
  return lines.join("\n");
}

/**
 * Update frontmatter in a file while preserving the content
 * Merges existing frontmatter with updates and rewrites the file
 */
export function updateFrontmatter(filePath: string, updates: Record<string, unknown>): void {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  const merged = { ...data, ...updates };
  const frontmatterYaml = serializeFrontmatter(merged);

  fs.writeFileSync(filePath, frontmatterYaml + "\n\n" + content.trim() + "\n", "utf-8");
}
