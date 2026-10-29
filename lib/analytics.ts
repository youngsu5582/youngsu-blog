/**
 * Google Analytics 커스텀 이벤트 유틸리티
 * production 환경에서만 동작
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function track(event: string, params?: Record<string, unknown>) {
  // 서버 렌더링 중이거나 GA 스크립트가 없는 환경에서는 이벤트를 조용히 생략한다.
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", event, params);
}

/** 검색어 원문은 수집하지 않는다. */
export function trackSearchResults(resultCount: number, language: "ko" | "en" | "all", surface: "dialog" | "page" = "dialog", filter?: string) {
  track("search_results", { result_count: resultCount, language, search_surface: surface, ...(filter && { search_filter: filter }) });
}

/** 선택한 결과의 유형과 화면상 1-based 순위를 기록한다. */
export function trackSearchResultSelect(type: string, rank: number, language: "ko" | "en" | "all", surface: "dialog" | "page" = "dialog") {
  track("search_result_select", { result_type: type, result_rank: rank, language, search_surface: surface });
}

/** 페이지 전체 스크롤이 아닌 포스트/아티클 본문 끝 노출 이벤트다. */
export function trackArticleEnd(slug: string, contentType: "post" | "article", language: "ko" | "en") {
  track("article_end_reached", { content_id: slug, content_type: contentType, language });
}

/** 관련 글·시리즈·이전/다음 탐색에서 출발 글과 도착 글, UI 위치를 기록한다. */
export function trackContentNavigation(source: string, destination: string, location: "related" | "series" | "prev_next") {
  track("content_navigation_click", { source_content_id: source, destination_content_id: destination, location });
}

/** 외부 링크 클릭 */
export function trackOutboundLink(url: string) {
  track("click", { event_category: "outbound", event_label: url, transport_type: "beacon" });
}

/** 테마 전환 */
export function trackThemeChange(theme: string) {
  track("theme_change", { theme });
}

/** 언어 전환 */
export function trackLangChange(from: string, to: string, contentId?: string, location?: string) {
  track("lang_change", { from_language: from, to_language: to, ...(contentId && { content_id: contentId }), location });
}

export function trackCodeCopy(contentId: string, contentType: string, language?: string) {
  track("code_copy", { content_id: contentId, content_type: contentType, ...(language && { code_language: language }) });
}

export function trackShareClick(method: string, slug: string) {
  track("share_click", { method, content_id: slug });
}

/** 공유 버튼 클릭 */
export function trackShare(method: string, slug: string) {
  track("share", { method, content_id: slug });
}
