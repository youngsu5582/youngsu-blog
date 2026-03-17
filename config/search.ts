export const searchConfig = {
  collections: ["posts", "articles", "library"] as const,
  searchableFields: ["title", "description", "tags", "categories", "content"] as const,
  weights: {
    title: 2,
    tags: 1.5,
    categories: 1.2,
    description: 1,
    content: 0.5,
  },
  maxResults: 20,
  minMatchCharLength: 2,
  threshold: 0.3,
};

export type SearchConfig = typeof searchConfig;
