"use client";

import { useEffect, useRef } from "react";
import { trackArticleEnd } from "@/lib/analytics";

interface ArticleEndTrackerProps {
  /** GA 이벤트에 함께 기록할 콘텐츠 slug */
  slug: string;
  /** 콘텐츠 컬렉션 구분. 포스트와 아티클 성과를 나눠 볼 때 사용한다. */
  contentType: "post" | "article";
  /** 포스트 번역 비교용 언어. 현재 아티클은 스키마에 언어가 없어 `ko`로 전달한다. */
  language: "ko" | "en";
}

/**
 * MDX 본문 끝 표시가 화면에 들어오면 `article_end_reached` 이벤트를 한 번 전송한다.
 * 완독을 증명하는 이벤트가 아니라 독자가 본문 끝까지 도달했다는 신호다.
 */
export function ArticleEndTracker({ slug, contentType, language }: ArticleEndTrackerProps) {
  const marker = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = marker.current;
    if (!element) return;
    // 본문 끝을 실제로 화면에 드러낸 상태(reached)와 GA 전송 완료(tracked)를 분리한다.
    let tracked = false;
    let reached = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const sendWhenReady = () => {
      if (!window.gtag) {
        // 본문 도달 직후 GA 스크립트가 아직 준비되지 않았을 때 운영 환경에서 재시도한다.
        if (process.env.NODE_ENV === "production") retry = setTimeout(sendWhenReady, 250);
        return;
      }
      tracked = true;
      trackArticleEnd(slug, contentType, language);
    };
    const observer = new IntersectionObserver((entries) => {
      if (!reached && !tracked && entries.some((entry) => entry.isIntersecting)) {
        reached = true;
        // 관찰자를 즉시 해제해 같은 페이지에서 재진입할 때 중복 이벤트가 나지 않게 한다.
        observer.disconnect();
        sendWhenReady();
      }
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      clearTimeout(retry);
    };
  }, [slug, contentType, language]);

  // 이 표시는 페이지 끝이 아니라 MDX 본문 바로 뒤에 배치해 본문 도달만 측정한다.
  return <div ref={marker} className="h-px" aria-hidden="true" />;
}
