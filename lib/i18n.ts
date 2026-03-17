export type Locale = "ko" | "en";

export const defaultLocale: Locale = "ko";
export const locales: Locale[] = ["ko", "en"];

// UI 텍스트 딕셔너리
const dictionaries: Record<Locale, Record<string, string>> = {
  ko: {
    "nav.home": "홈",
    "nav.posts": "포스트",
    "nav.articles": "아티클",
    "nav.library": "서재",
    "nav.activities": "활동",
    "nav.about": "소개",
    "nav.categories": "카테고리",
    "nav.tags": "태그",
    "post.readingTime": "분 읽기",
    "post.writtenBy": "작성자",
    "post.recentPosts": "최근 포스트",
    "post.allPosts": "전체 포스트",
    "post.noPosts": "포스트가 없습니다.",
    "search.placeholder": "검색...",
    "search.noResults": "검색 결과가 없습니다.",
    "toc.title": "목차",
    "footer.rights": "All rights reserved.",
    "common.prev": "이전",
    "common.next": "다음",
    "article.status.evergreen": "상록수",
    "article.status.seed": "씨앗",
    "library.book": "도서",
    "library.movie": "영화",
  },
  en: {
    "nav.home": "Home",
    "nav.posts": "Posts",
    "nav.articles": "Articles",
    "nav.library": "Library",
    "nav.activities": "Activities",
    "nav.about": "About",
    "nav.categories": "Categories",
    "nav.tags": "Tags",
    "post.readingTime": "min read",
    "post.writtenBy": "Written by",
    "post.recentPosts": "Recent Posts",
    "post.allPosts": "All Posts",
    "post.noPosts": "No posts found.",
    "search.placeholder": "Search...",
    "search.noResults": "No results found.",
    "toc.title": "Table of Contents",
    "footer.rights": "All rights reserved.",
    "common.prev": "Previous",
    "common.next": "Next",
    "article.status.evergreen": "Evergreen",
    "article.status.seed": "Seed",
    "library.book": "Book",
    "library.movie": "Movie",
  },
};

export function t(key: string, locale: Locale = defaultLocale): string {
  return dictionaries[locale]?.[key] || dictionaries[defaultLocale]?.[key] || key;
}

export function getLocaleLabel(locale: Locale): string {
  return locale === "ko" ? "한국어" : "English";
}
