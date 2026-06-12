import { describe, expect, it } from "vitest";

import { filterSearchItems, getSearchFacets, splitHighlightedText, type SearchItem } from "@/lib/search";

const items: SearchItem[] = [
  {
    title: "Homelab Docker 운영기",
    slug: "homelab-docker",
    description: "홈서버와 Docker Compose 운영 기록",
    tags: ["docker", "homelab"],
    categories: ["homelab"],
    type: "post",
    lang: "ko",
  },
  {
    title: "Running notes",
    slug: "running-notes",
    description: "5km training log",
    tags: ["running"],
    categories: ["life"],
    type: "note",
  },
];

describe("search helpers", () => {
  it("검색어와 타입 필터를 함께 적용한다", () => {
    expect(filterSearchItems(items, { query: "docker", type: "post" }).map((item) => item.slug)).toEqual([
      "homelab-docker",
    ]);
    expect(filterSearchItems(items, { query: "docker", type: "note" })).toEqual([]);
  });

  it("검색 결과 타입 facet count를 만든다", () => {
    expect(getSearchFacets(items)).toEqual([
      { type: "post", count: 1 },
      { type: "note", count: 1 },
    ]);
  });

  it("검색어가 포함된 텍스트를 highlight 조각으로 나눈다", () => {
    expect(splitHighlightedText("Homelab Docker 운영기", "docker")).toEqual([
      { text: "Homelab ", match: false },
      { text: "Docker", match: true },
      { text: " 운영기", match: false },
    ]);
  });
});
