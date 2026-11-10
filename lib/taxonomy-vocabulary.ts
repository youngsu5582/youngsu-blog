/**
 * AI 에게 보낼 카테고리 · 태그 어휘와, AI 가 돌려준 제안을 정본으로 다듬는 규칙.
 *
 * 글의 frontmatter 는 아직 표기가 섞여 있다(`백엔드`/`Backend`, `Java`/`java` 등). 그대로 넘기면 모델이 그 불일치를
 * 따라 하므로, 보낼 때와 받을 때 모두 여기 별칭 표로 정본 이름에 맞춘다. 글을 정리할 때도 같은 표를 쓴다.
 *
 * - 카테고리: 정해 둔 목록에서만 고른다. 목록에 없는 제안은 버린다 — 큰 분류는 사람이 정한다.
 * - 태그: 표기만 다른 것은 가장 많이 쓰인 표기로 모은다. 기술 용어의 한영 짝은 영어 쪽이 정본이다.
 *   기존에 없는 새 태그는 막지 않고 표시해, 받아들일지 사람이 고르게 한다.
 */

/** 제안 프롬프트의 규칙. 워크벤치 템플릿과 기존 프로바이더 프롬프트가 함께 쓴다. */
export const SUGGEST_RULES = `규칙:
- description: 1-2문장으로 포스트 요약 (한국어)
- categories: 카테고리 목록에서만 고른다 (최대 2개). 맞는 것이 없으면 빈 배열로 둔다
- tags: 자주 쓰는 태그(괄호 안은 쓰인 횟수)에서 먼저 고르고, 맞는 것이 없을 때만 새로 만든다 (최대 5개)
- 새 태그는 기술 용어면 영어 소문자와 하이픈으로(예: spring-boot, kafka), 그 밖에는 한국어로 쓴다`;

/** 서재(library)는 책 · 영화 · 러닝을 다뤄 다른 글과 분류 축이 다르다. */
export const LIBRARY_CATEGORIES = ["도서", "영화", "러닝"] as const;
export const GENERAL_CATEGORIES = [
  "백엔드", "스프링", "자바", "코틀린", "Kafka", "데이터베이스", "인프라", "테스트", "클린코드",
  "프로그래밍", "개발자 생산성", "AI", "깃허브", "블로그", "회고", "커리어", "기타",
] as const;

/** 옛 카테고리 이름 → 정본. 목록에도 별칭에도 없는 이름(학습 · 연도 등)은 AI 에게 보이지 않는다. */
const CATEGORY_ALIASES: Record<string, string> = {
  Backend: "백엔드",
  Spring: "스프링",
  Java: "자바",
  Testing: "테스트",
  Database: "데이터베이스",
  PostgreSQL: "데이터베이스",
  Redis: "데이터베이스",
  Blog: "블로그",
  "Good Code": "클린코드",
  "코드 품질": "클린코드",
  모니터링: "인프라",
  Monitoring: "인프라",
  Homeserver: "인프라",
  "CI/CD": "인프라",
  AWS: "인프라",
  도커: "인프라",
  쿠버네티스: "인프라",
  DevOps: "인프라",
  네트워크: "인프라",
  피드백: "커리어",
  마음가짐: "커리어",
  소프트스킬: "커리어",
  "Claude Code": "AI",
  Claude: "AI",
  소설: "도서",
  국내도서: "도서",
  일본도서: "도서",
  국내영화: "영화",
};

/** 태그 별칭. 값이 null 이면 분류용으로 남은 흔적이라 버린다. 키는 [tagKey] 로 비교한다. */
const TAG_ALIASES: Record<string, string | null> = {
  스프링: "spring",
  자바: "java",
  깃: "git",
  깃허브: "github",
  코틀린: "kotlin",
  테스트: "testing",
  데이터베이스: "database",
  비동기: "async",
  클린코드: "clean-code",
  리팩토링: "refactoring",
  우아한테크코스: "우테코",
  "topic/java": "java",
  "topic/kafka": "kafka",
  "topic/postgresql": "postgresql",
  "ci/cd": "ci-cd",
  "type/guide": null,
  "topic/tech": null,
};

/** 대소문자 · 공백 · 하이픈 · 밑줄 · 점만 다른 표기를 같은 것으로 본다. 슬래시는 남긴다(`topic/java` ≠ `topicjava`). */
export function tagKey(tag: string): string {
  return tag.trim().toLowerCase().replace(/[\s_\-.]/g, "");
}

const ALIAS_BY_KEY = new Map(Object.entries(TAG_ALIASES).map(([from, to]) => [tagKey(from), to]));

export interface Counted {
  name: string;
  count: number;
}

export interface TaxonomyVocabulary {
  /** 이 글이 고를 수 있는 카테고리 정본 목록. */
  categories: readonly string[];
  /** 2번 이상 쓰인 태그, 정본 이름으로 모아 많이 쓰인 순. */
  frequentTags: Counted[];
  /** 태그 키 → 정본 표기. 새 태그인지 가리고, 표기만 다른 제안을 기존 표기로 바꾼다. */
  knownTags: Map<string, string>;
}

export function categoriesFor(collection: string): readonly string[] {
  return collection === "library" ? LIBRARY_CATEGORIES : GENERAL_CATEGORIES;
}

/** 카테고리를 정본으로 바꾼다. 목록에 없으면 null. */
export function canonicalCategory(name: string, allowed: readonly string[]): string | null {
  const trimmed = name.trim();
  const mapped = CATEGORY_ALIASES[trimmed] ?? trimmed;
  return allowed.includes(mapped) ? mapped : null;
}

/** 별칭을 먼저 적용한다. 버릴 태그면 null. */
function aliasTag(tag: string): string | null {
  const key = tagKey(tag);
  return ALIAS_BY_KEY.has(key) ? ALIAS_BY_KEY.get(key)! : tag.trim();
}

/** 기존 태그를 정본 이름으로 모은다. 표기만 다르면 가장 많이 쓰인 표기가 정본이다. */
export function buildVocabulary(tags: Counted[], collection: string): TaxonomyVocabulary {
  const byKey = new Map<string, { forms: Map<string, number>; total: number }>();
  for (const { name, count } of tags) {
    const aliased = aliasTag(name);
    if (!aliased) continue;
    const key = tagKey(aliased);
    const entry = byKey.get(key) ?? { forms: new Map(), total: 0 };
    entry.forms.set(aliased, (entry.forms.get(aliased) ?? 0) + count);
    entry.total += count;
    byKey.set(key, entry);
  }
  const knownTags = new Map<string, string>();
  const merged: Counted[] = [];
  for (const [key, { forms, total }] of byKey) {
    const canonical = [...forms.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
    knownTags.set(key, canonical);
    merged.push({ name: canonical, count: total });
  }
  return {
    categories: categoriesFor(collection),
    frequentTags: merged.filter((t) => t.count >= 2).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    knownTags,
  };
}

/** 프롬프트에 넣을 태그 목록. 쓰인 횟수를 붙여 자리 잡은 태그를 먼저 고르게 한다. */
export function formatTagList(tags: Counted[]): string {
  return tags.map((t) => `${t.name}(${t.count})`).join(", ");
}

/** 새 태그의 표기. 기술 용어(영문)는 소문자와 하이픈으로 쓴다. 한글이 든 태그는 앞뒤 공백만 정리한다. */
function newTagForm(tag: string): string {
  return /^[\x20-\x7E]+$/.test(tag) ? tag.trim().toLowerCase().replace(/\s+/g, "-") : tag.trim().replace(/\s+/g, " ");
}

export interface RefinedSuggestion {
  description?: string;
  /** 비어 있으면 빼서, 적용할 때 기존 카테고리를 지우지 않게 한다. */
  categories?: string[];
  tags?: string[];
  /** 기존에 없던 태그. 화면이 표시해 사람이 받아들일지 고른다. */
  newTags: string[];
  /** 목록에 없어 뺀 카테고리. */
  droppedCategories: string[];
}

const MAX_CATEGORIES = 2;
const MAX_TAGS = 5;

/** AI 가 돌려준 제안을 정본으로 다듬는다. 모델이 무엇을 냈든 결과는 이 규칙을 따른다. */
export function refineSuggestion(raw: unknown, vocabulary: TaxonomyVocabulary): RefinedSuggestion {
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const strings = (value: unknown) => (Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : []);

  const categories: string[] = [];
  const droppedCategories: string[] = [];
  for (const name of strings(input.categories)) {
    const canonical = canonicalCategory(name, vocabulary.categories);
    if (!canonical) droppedCategories.push(name.trim());
    else if (!categories.includes(canonical)) categories.push(canonical);
  }

  const tags: string[] = [];
  const newTags: string[] = [];
  for (const name of strings(input.tags)) {
    const aliased = aliasTag(name);
    if (!aliased) continue;
    const known = vocabulary.knownTags.get(tagKey(aliased));
    const tag = known ?? newTagForm(aliased);
    if (!tag || tags.some((t) => tagKey(t) === tagKey(tag))) continue;
    tags.push(tag);
    if (!known) newTags.push(tag);
  }
  const keptTags = tags.slice(0, MAX_TAGS);

  const description = typeof input.description === "string" && input.description.trim() ? input.description.trim() : undefined;
  return {
    ...(description ? { description } : {}),
    ...(categories.length ? { categories: categories.slice(0, MAX_CATEGORIES) } : {}),
    ...(keptTags.length ? { tags: keptTags } : {}),
    newTags: newTags.filter((t) => keptTags.includes(t)),
    droppedCategories,
  };
}
