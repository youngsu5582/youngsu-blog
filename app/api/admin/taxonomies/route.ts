import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

import { buildTaxonomySummary, renameTaxonomyValues, type TaxonomyContentItem, type TaxonomyField } from "@/lib/admin-taxonomy";
import { serializeFrontmatter } from "@/lib/frontmatter";

const CONTENT_COLLECTIONS = ["posts", "articles", "notes", "library"] as const;
const CONTENT_EXTENSIONS = new Set([".md", ".mdx"]);

function isTaxonomyField(field: unknown): field is TaxonomyField {
  return field === "tags" || field === "categories";
}

function listContentFiles(): string[] {
  const contentRoot = path.resolve(process.cwd(), "content");
  const files: string[] = [];

  CONTENT_COLLECTIONS.forEach((collection) => {
    const collectionDir = path.join(contentRoot, collection);
    if (!fs.existsSync(collectionDir)) return;

    fs.readdirSync(collectionDir)
      .filter((filename) => CONTENT_EXTENSIONS.has(path.extname(filename)))
      .forEach((filename) => files.push(`content/${collection}/${filename}`));
  });

  return files;
}

function readTaxonomyItems(): TaxonomyContentItem[] {
  return listContentFiles().map((repoPath) => {
    const absPath = path.resolve(process.cwd(), repoPath);
    const raw = fs.readFileSync(absPath, "utf-8");
    const { data } = matter(raw);

    return {
      repoPath,
      title: typeof data.title === "string" ? data.title : repoPath,
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      categories: Array.isArray(data.categories) ? data.categories.map(String) : [],
    };
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fieldParam = searchParams.get("field") || "tags";

  if (!isTaxonomyField(fieldParam)) {
    return NextResponse.json({ error: "field는 tags 또는 categories만 가능합니다" }, { status: 400 });
  }

  try {
    const items = readTaxonomyItems();
    return NextResponse.json({
      field: fieldParam,
      items: buildTaxonomySummary(items, fieldParam),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { field, from, to } = await req.json();

    if (!isTaxonomyField(field)) {
      return NextResponse.json({ error: "field는 tags 또는 categories만 가능합니다" }, { status: 400 });
    }
    if (typeof from !== "string" || typeof to !== "string" || !from.trim() || !to.trim()) {
      return NextResponse.json({ error: "from/to 값이 필요합니다" }, { status: 400 });
    }

    const updatedFiles: string[] = [];

    listContentFiles().forEach((repoPath) => {
      const absPath = path.resolve(process.cwd(), repoPath);
      const raw = fs.readFileSync(absPath, "utf-8");
      const { data, content } = matter(raw);
      const currentValues = Array.isArray(data[field]) ? data[field].map(String) : [];
      const nextValues = renameTaxonomyValues(currentValues, from, to);

      if (JSON.stringify(currentValues) !== JSON.stringify(nextValues)) {
        fs.writeFileSync(
          absPath,
          `${serializeFrontmatter({ ...data, [field]: nextValues })}\n\n${content.trim()}\n`,
          "utf-8"
        );
        updatedFiles.push(repoPath);
      }
    });

    return NextResponse.json({ success: true, updatedFiles });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
