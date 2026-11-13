import type { Metadata } from "next";
import { locales } from "@/lib/i18n";
import { buildCategoryMetadata, CategoryView, getCategoryParentPairs } from "../../category-view";

// 공개 주소: /categories/{category}?lang={lang}&parent={parent} — next.config rewrite 가 이 경로로 옮긴다
interface CategoryWithParentPageProps {
  params: Promise<{ category: string; lang: string; parent: string }>;
}

export async function generateStaticParams() {
  return getCategoryParentPairs().flatMap(({ category, parent }) =>
    locales.map((lang) => ({
      category,
      lang,
      parent,
    })),
  );
}

export async function generateMetadata({ params }: CategoryWithParentPageProps): Promise<Metadata> {
  return buildCategoryMetadata(await params);
}

export default async function CategoryWithParentPage({ params }: CategoryWithParentPageProps) {
  return <CategoryView {...await params} />;
}
