import { describe, expect, it } from "vitest";

import { buildVocabulary, canonicalCategory, formatTagList, GENERAL_CATEGORIES, refineSuggestion } from "@/lib/taxonomy-vocabulary";

const tags = [
  { name: "java", count: 7 },
  { name: "Java", count: 3 },
  { name: "자바", count: 5 },
  { name: "GitHub", count: 2 },
  { name: "깃허브", count: 4 },
  { name: "우테코", count: 40 },
  { name: "우아한 테크코스", count: 2 },
  { name: "type/guide", count: 5 },
  { name: "회고", count: 8 },
  { name: "한번만", count: 1 },
];

describe("카테고리 · 태그 어휘", () => {
  it("표기만 다른 태그와 한영 짝을 정본으로 모으고 횟수를 합친다", () => {
    const vocabulary = buildVocabulary(tags, "posts");

    expect(vocabulary.frequentTags).toEqual([
      { name: "우테코", count: 42 },
      { name: "java", count: 15 },
      { name: "회고", count: 8 },
      // 깃허브는 별칭으로 github 가 되고, 기존 표기 GitHub 과 키가 같아 더 많이 쓰인 쪽(github 6 > GitHub 2)이 정본이 된다.
      { name: "github", count: 6 },
    ]);
    expect(formatTagList(vocabulary.frequentTags)).toBe("우테코(42), java(15), 회고(8), github(6)");
  });

  it("한 번만 쓰인 태그와 분류용 흔적은 자주 쓰는 태그로 보내지 않는다", () => {
    const names = buildVocabulary(tags, "posts").frequentTags.map((t) => t.name);

    expect(names).not.toContain("한번만");
    expect(names).not.toContain("type/guide");
  });

  it("서재는 서재 카테고리만, 나머지는 일반 카테고리만 고른다", () => {
    expect(buildVocabulary([], "library").categories).toEqual(["도서", "영화", "러닝"]);
    expect(buildVocabulary([], "notes").categories).toEqual(GENERAL_CATEGORIES);
    expect(canonicalCategory("Backend", GENERAL_CATEGORIES)).toBe("백엔드");
    expect(canonicalCategory("국내도서", ["도서", "영화", "러닝"])).toBe("도서");
    expect(canonicalCategory("2024", GENERAL_CATEGORIES)).toBeNull();
  });
});

describe("AI 제안 다듬기", () => {
  const vocabulary = buildVocabulary(tags, "posts");

  it("카테고리는 별칭으로 정본에 맞추고, 목록에 없는 것은 빼서 알린다", () => {
    const refined = refineSuggestion({ categories: ["Backend", "백엔드", "동시성", "Spring"] }, vocabulary);

    expect(refined.categories).toEqual(["백엔드", "스프링"]);
    expect(refined.droppedCategories).toEqual(["동시성"]);
  });

  it("맞는 카테고리가 하나도 없으면 비워 두지 않고 빼서, 적용할 때 기존 카테고리를 지우지 않는다", () => {
    const refined = refineSuggestion({ categories: ["학습"] }, vocabulary);

    expect(refined).not.toHaveProperty("categories");
  });

  it("태그는 기존 표기로 바꾸고, 기존에 없는 태그는 규칙대로 적어 새 태그로 표시한다", () => {
    const refined = refineSuggestion({ tags: ["Java", "자바", "우아한테크코스", "GraalVM Native", "토스 페이먼츠", "type/guide"] }, vocabulary);

    expect(refined.tags).toEqual(["java", "우테코", "graalvm-native", "토스 페이먼츠"]);
    expect(refined.newTags).toEqual(["graalvm-native", "토스 페이먼츠"]);
  });

  it("태그는 5개, 카테고리는 2개까지만 남기고 설명은 앞뒤 공백을 지운다", () => {
    const refined = refineSuggestion(
      { description: "  요약  ", categories: ["백엔드", "자바", "테스트"], tags: ["a", "b", "c", "d", "e", "f"] },
      vocabulary
    );

    expect(refined.description).toBe("요약");
    expect(refined.categories).toHaveLength(2);
    expect(refined.tags).toEqual(["a", "b", "c", "d", "e"]);
    expect(refined.newTags).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("모델이 형식에 맞지 않는 값을 내도 깨지지 않는다", () => {
    expect(refineSuggestion("JSON 아님", vocabulary)).toEqual({ newTags: [], droppedCategories: [] });
    expect(refineSuggestion({ tags: [1, null, "java"] }, vocabulary).tags).toEqual(["java"]);
  });
});
