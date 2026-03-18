import { getAllPosts, getUrlSlug } from "@/lib/content";
import Link from "next/link";
import { ChevronRight, Folder, FolderOpen } from "lucide-react";

export const metadata = {
  title: "카테고리",
  description: "카테고리별 글 모아보기",
};

interface CategoryNode {
  name: string;
  count: number;
  children: Map<string, CategoryNode>;
}

function buildCategoryTree(posts: Array<{ categories: string[] }>) {
  const tree = new Map<string, CategoryNode>();

  posts.forEach((post) => {
    if (post.categories.length === 0) return;

    const parent = post.categories[0];
    if (!tree.has(parent)) {
      tree.set(parent, { name: parent, count: 0, children: new Map() });
    }
    const parentNode = tree.get(parent)!;
    parentNode.count++;

    // Sub-categories (2nd element onwards)
    for (let i = 1; i < post.categories.length; i++) {
      const child = post.categories[i];
      if (!parentNode.children.has(child)) {
        parentNode.children.set(child, { name: child, count: 0, children: new Map() });
      }
      parentNode.children.get(child)!.count++;
    }
  });

  // Sort by count descending
  return new Map(
    [...tree.entries()].sort((a, b) => b[1].count - a[1].count)
  );
}

export default function CategoriesPage() {
  const posts = getAllPosts();
  const tree = buildCategoryTree(posts);
  const totalCategories = [...tree.values()].reduce(
    (acc, node) => acc + 1 + node.children.size,
    0
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight theme-heading">카테고리</h1>
        <p className="text-muted-foreground mt-3 text-sm">
          {tree.size}개의 상위 카테고리, 총 {totalCategories}개
        </p>
      </div>

      <div className="space-y-4">
        {[...tree.entries()].map(([parentName, node]) => (
          <div
            key={parentName}
            className="rounded-lg border border-border/60 overflow-hidden"
          >
            {/* Parent category header */}
            <Link
              href={`/categories/${encodeURIComponent(parentName)}`}
              className="flex items-center justify-between px-5 py-3.5 bg-card hover:bg-primary/5 dark:hover:bg-primary/8 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <FolderOpen className="h-4 w-4 text-primary" />
                <span className="font-medium group-hover:text-primary transition-colors">
                  {parentName}
                </span>
              </div>
              <span className="text-xs text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                {node.count}
              </span>
            </Link>

            {/* Child categories */}
            {node.children.size > 0 && (
              <div className="border-t border-border/40">
                {[...node.children.entries()]
                  .sort((a, b) => b[1].count - a[1].count)
                  .map(([childName, childNode]) => (
                    <Link
                      key={childName}
                      href={`/categories/${encodeURIComponent(childName)}`}
                      className="flex items-center justify-between px-5 py-2.5 pl-12 hover:bg-primary/4 dark:hover:bg-primary/6 transition-colors group border-b border-border/20 last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                        <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                          {childName}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground/60">
                        {childNode.count}
                      </span>
                    </Link>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
