// NOTE: 이 파일은 velite.config.ts 스키마와 수동으로 동기화해야 한다.
// (#site/content 경로가 .velite/index.d.ts 대신 이 선언으로 resolve됨)
declare module "#site/content" {
  export interface Post {
    title: string;
    date: string;
    /** 최종 수정일 (frontmatter `updated`) — sitemap lastModified, JSON-LD dateModified에 사용 */
    updated?: string;
    description: string;
    categories: string[];
    tags: string[];
    image?: string;
    author: string;
    toc: boolean;
    comments: boolean;
    draft: boolean;
    lang: "ko" | "en";
    series?: string;
    seriesOrder?: number;
    seriesDescription?: string;
    seriesStatus?: "ongoing" | "completed";
    related: string[];
    slug: string;
    body: string;
    /** RSS content:encoded 용 렌더링된 HTML (s.markdown()) */
    html: string;
    metadata: {
      readingTime: number;
      wordCount: number;
    };
  }

  export interface Article {
    title: string;
    date: string;
    description: string;
    categories: string[];
    tags: string[];
    image?: string;
    author: string;
    moc?: string;
    status: "evergreen" | "seed" | "draft";
    subTopic?: string;
    slug: string;
    body: string;
    /** RSS content:encoded 용 렌더링된 HTML (s.markdown()) */
    html: string;
    metadata: {
      readingTime: number;
      wordCount: number;
    };
  }

  export interface LibraryItem {
    title: string;
    date: string;
    description: string;
    categories: string[];
    tags: string[];
    image?: string;
    author: string;
    mediaType: "book" | "movie";
    rating?: number;
    slug: string;
    body: string;
    metadata: {
      readingTime: number;
      wordCount: number;
    };
  }

  export const posts: Post[];
  export const articles: Article[];
  export const library: LibraryItem[];
}
