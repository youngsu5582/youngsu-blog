import { describe, it, expect } from "vitest";
import {
  getUrlSlug,
  getAllPosts,
  getPostBySlug,
  getPostsByCategory,
  getPostsByTag,
  getAllCategories,
  getAllTags,
  calcReadingTimeFromBody,
  getAllArticles,
  getAllLibraryItems,
  getAllNotes,
} from "@/lib/content";

describe("getUrlSlug", () => {
  it("posts/ 접두사를 제거한다", () => {
    expect(getUrlSlug("posts/hello-world")).toBe("hello-world");
  });

  it("articles/ 접두사를 제거한다", () => {
    expect(getUrlSlug("articles/my-article")).toBe("my-article");
  });

  it("library/ 접두사를 제거한다", () => {
    expect(getUrlSlug("library/clean-code")).toBe("clean-code");
  });

  it("접두사가 없으면 그대로 반환한다", () => {
    expect(getUrlSlug("hello-world")).toBe("hello-world");
  });
});

describe("getAllPosts", () => {
  it("포스트 배열을 반환한다", () => {
    const posts = getAllPosts();
    expect(Array.isArray(posts)).toBe(true);
    expect(posts.length).toBeGreaterThan(0);
  });

  it("draft 포스트는 제외한다", () => {
    const posts = getAllPosts();
    posts.forEach((post) => {
      expect(post.draft).not.toBe(true);
    });
  });

  it("날짜 내림차순으로 정렬되어 있다", () => {
    const posts = getAllPosts();
    for (let i = 0; i < posts.length - 1; i++) {
      expect(new Date(posts[i].date).getTime()).toBeGreaterThanOrEqual(
        new Date(posts[i + 1].date).getTime()
      );
    }
  });

  it("lang 필터가 동작한다", () => {
    const koPosts = getAllPosts("ko");
    const enPosts = getAllPosts("en");
    koPosts.forEach((p) => expect(p.lang).toBe("ko"));
    enPosts.forEach((p) => expect(p.lang).toBe("en"));
  });

  it("ko + en 합이 전체와 같다", () => {
    const all = getAllPosts();
    const ko = getAllPosts("ko");
    const en = getAllPosts("en");
    expect(ko.length + en.length).toBe(all.length);
  });
});

describe("getPostBySlug", () => {
  it("slug로 포스트를 찾는다", () => {
    const posts = getAllPosts();
    if (posts.length > 0) {
      const slug = getUrlSlug(posts[0].slug);
      const found = getPostBySlug(slug);
      expect(found).toBeDefined();
      expect(found?.title).toBe(posts[0].title);
    }
  });

  it("없는 slug는 undefined를 반환한다", () => {
    const found = getPostBySlug("non-existent-post-12345");
    expect(found).toBeUndefined();
  });
});

describe("getPostsByCategory", () => {
  it("카테고리로 포스트를 필터링한다", () => {
    const categories = getAllCategories();
    if (categories.length > 0) {
      const cat = categories[0].name;
      const posts = getPostsByCategory(cat);
      expect(posts.length).toBeGreaterThan(0);
      posts.forEach((p) => expect(p.categories).toContain(cat));
    }
  });

  it("lang 필터가 동작한다", () => {
    const categories = getAllCategories("ko");
    if (categories.length > 0) {
      const cat = categories[0].name;
      const koPosts = getPostsByCategory(cat, "ko");
      koPosts.forEach((p) => expect(p.lang).toBe("ko"));
    }
  });
});

describe("getPostsByTag", () => {
  it("태그로 포스트를 필터링한다", () => {
    const tags = getAllTags();
    if (tags.length > 0) {
      const tag = tags[0].name;
      const posts = getPostsByTag(tag);
      expect(posts.length).toBeGreaterThan(0);
      posts.forEach((p) => expect(p.tags).toContain(tag));
    }
  });
});

describe("getAllCategories", () => {
  it("카테고리 배열을 반환한다", () => {
    const cats = getAllCategories();
    expect(Array.isArray(cats)).toBe(true);
    cats.forEach((c) => {
      expect(c).toHaveProperty("name");
      expect(c).toHaveProperty("count");
      expect(c.count).toBeGreaterThan(0);
    });
  });

  it("count 내림차순으로 정렬되어 있다", () => {
    const cats = getAllCategories();
    for (let i = 0; i < cats.length - 1; i++) {
      expect(cats[i].count).toBeGreaterThanOrEqual(cats[i + 1].count);
    }
  });

  it("lang 필터가 동작한다", () => {
    const koCats = getAllCategories("ko");
    const enCats = getAllCategories("en");
    expect(koCats.length).toBeGreaterThan(0);
    expect(enCats.length).toBeGreaterThan(0);
  });
});

describe("getAllTags", () => {
  it("태그 배열을 반환한다", () => {
    const tags = getAllTags();
    expect(Array.isArray(tags)).toBe(true);
    expect(tags.length).toBeGreaterThan(0);
  });
});

describe("calcReadingTimeFromBody", () => {
  it("빈 문자열은 1분을 반환한다", () => {
    expect(calcReadingTimeFromBody("")).toBe(1);
  });

  it("긴 텍스트는 1분 이상을 반환한다", () => {
    const longText = '"' + "가".repeat(1000) + '"';
    expect(calcReadingTimeFromBody(longText)).toBeGreaterThan(1);
  });
});

describe("getAllArticles", () => {
  it("아티클 배열을 반환한다", () => {
    const articles = getAllArticles();
    expect(Array.isArray(articles)).toBe(true);
  });
});

describe("getAllLibraryItems", () => {
  it("서재 아이템 배열을 반환한다", () => {
    const items = getAllLibraryItems();
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
  });
});

describe("getAllNotes", () => {
  it("노트 배열을 반환한다", () => {
    const notes = getAllNotes();
    expect(Array.isArray(notes)).toBe(true);
  });
});
