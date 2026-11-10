import { getAllTags } from "@/lib/content";
import { buildVocabulary, type TaxonomyVocabulary } from "@/lib/taxonomy-vocabulary";

/**
 * 메타데이터 제안에 쓸 어휘. 한국어 원문의 태그만 센다 — 영어 번역본 태그까지 세면 한영 짝이 뒤섞인다.
 * 컬렉션을 받아, 서재는 서재 카테고리만 고르게 한다. 요청을 보낼 때와 결과를 다듬을 때 같은 어휘를 쓴다.
 */
export function loadSuggestVocabulary(collection: string): TaxonomyVocabulary {
  return buildVocabulary(getAllTags("ko"), collection);
}

/** 저장소 경로(content/<컬렉션>/…)의 컬렉션. */
export function collectionOf(repoPath: string): string {
  return repoPath.split("/")[1] ?? "posts";
}
