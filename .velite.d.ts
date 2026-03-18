declare module "#site/content" {
  export interface Post {
    title: string;
    date: string;
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
    slug: string;
    body: string;
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
