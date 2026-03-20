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
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", event, params);
}

/** 검색 이벤트 */
export function trackSearch(query: string, resultCount: number) {
  track("search", { search_term: query, result_count: resultCount });
}

/** 포스트 읽기 완료 (스크롤 75%+) */
export function trackReadComplete(slug: string, title: string) {
  track("read_complete", { slug, title, content_type: "post" });
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
export function trackLangChange(lang: string) {
  track("lang_change", { language: lang });
}

/** 공유 버튼 클릭 */
export function trackShare(method: string, slug: string) {
  track("share", { method, content_id: slug });
}
