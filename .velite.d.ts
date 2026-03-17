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
    slug: string;
    body: string;
    metadata: {
      readingTime: number;
      wordCount: number;
    };
  }

  export const posts: Post[];
}
