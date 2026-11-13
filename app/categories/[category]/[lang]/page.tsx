import type { Metadata } from "next";
import { getAllCategories } from "@/lib/content";
import { locales } from "@/lib/i18n";
import { buildCategoryMetadata, CategoryView } from "../category-view";

// 공개 주소: /categories/{category}?lang={lang} — next.config rewrite 가 이 경로로 옮긴다
interface CategoryPageProps {
  params: Promise<{ category: string; lang: string }>;
}

export async function generateStaticParams() {
  return getAllCategories().flatMap(({ name }) =>
    locales.map((lang) => ({ category: name, lang })),
  );
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  return buildCategoryMetadata(await params);
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  return <CategoryView {...await params} />;
}
