import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { BLOG_REPO_ROOT } from "@/lib/blog-repo-root";

export type SeriesStatus = "ongoing" | "completed";

export interface AdminSeriesPost {
  slug: string;
  title: string;
  order?: number;
}

export interface AdminSeriesOption {
  name: string;
  description?: string;
  status: SeriesStatus;
  posts: AdminSeriesPost[];
  nextOrder: number;
}

const POSTS_DIR = path.join(BLOG_REPO_ROOT, "content", "posts");

function readPostFiles() {
  let files: string[] = [];
  try {
    files = fs
      .readdirSync(POSTS_DIR)
      .filter((file) => file.endsWith(".mdx") || file.endsWith(".md"));
  } catch {
    return [];
  }

  return files.flatMap((filename) => {
    const filePath = path.join(POSTS_DIR, filename);
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const { data } = matter(raw);
      return [
        {
          filePath: `content/posts/${filename}`,
          slug: filename.replace(/\.mdx?$/, ""),
          title: typeof data.title === "string" ? data.title : filename,
          series: typeof data.series === "string" ? data.series.trim() : "",
          seriesOrder:
            typeof data.seriesOrder === "number" && Number.isFinite(data.seriesOrder)
              ? data.seriesOrder
              : undefined,
          seriesDescription:
            typeof data.seriesDescription === "string" ? data.seriesDescription.trim() : undefined,
          seriesStatus:
            data.seriesStatus === "completed" ? ("completed" as const) : ("ongoing" as const),
        },
      ];
    } catch {
      return [];
    }
  });
}

export function getAdminSeriesOptions(): AdminSeriesOption[] {
  const grouped = new Map<string, AdminSeriesOption>();

  for (const post of readPostFiles()) {
    if (!post.series) continue;
    const current = grouped.get(post.series) ?? {
      name: post.series,
      description: undefined,
      status: "ongoing" as SeriesStatus,
      posts: [],
      nextOrder: 1,
    };

    if (!current.description && post.seriesDescription)
      current.description = post.seriesDescription;
    if (post.seriesStatus === "completed") current.status = "completed";
    current.posts.push({ slug: post.slug, title: post.title, order: post.seriesOrder });
    grouped.set(post.series, current);
  }

  return Array.from(grouped.values())
    .map((series) => {
      series.posts.sort((a, b) => {
        const orderA = a.order ?? Number.POSITIVE_INFINITY;
        const orderB = b.order ?? Number.POSITIVE_INFINITY;
        return orderA - orderB || a.title.localeCompare(b.title, "ko");
      });
      const orders = series.posts
        .map((post) => post.order)
        .filter((order): order is number => typeof order === "number");
      return { ...series, nextOrder: orders.length > 0 ? Math.max(...orders) + 1 : 1 };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

export function normalizeSeriesOrder(value: unknown) {
  if (value === "" || value === undefined || value === null) return undefined;
  const order = typeof value === "number" ? value : Number(value);
  return Number.isInteger(order) && order > 0 ? order : undefined;
}

export function validateSeriesAssignment({
  series,
  seriesOrder,
  filePath,
  requireOrder = false,
}: {
  series: unknown;
  seriesOrder: unknown;
  filePath?: string;
  requireOrder?: boolean;
}) {
  const name = typeof series === "string" ? series.trim() : "";
  if (!name) return null;

  const order = normalizeSeriesOrder(seriesOrder);
  if (requireOrder && order === undefined) return "시리즈 순서는 1 이상의 정수로 입력하세요.";

  const duplicate = readPostFiles().find(
    (post) =>
      post.filePath !== filePath &&
      post.series === name &&
      order !== undefined &&
      post.seriesOrder === order,
  );
  if (duplicate) return `시리즈 ${name}에 이미 ${order}편이 있습니다: ${duplicate.title}`;
  return null;
}

export function buildSeriesFrontmatter({
  series,
  seriesOrder,
  seriesDescription,
  seriesStatus,
}: {
  series?: unknown;
  seriesOrder?: unknown;
  seriesDescription?: unknown;
  seriesStatus?: unknown;
}) {
  const name = typeof series === "string" ? series.trim() : "";
  if (!name) return {};

  const order = normalizeSeriesOrder(seriesOrder);
  const description = typeof seriesDescription === "string" ? seriesDescription.trim() : "";
  const status: SeriesStatus = seriesStatus === "completed" ? "completed" : "ongoing";

  return {
    series: name,
    ...(order !== undefined ? { seriesOrder: order } : {}),
    ...(description ? { seriesDescription: description } : {}),
    seriesStatus: status,
  };
}
