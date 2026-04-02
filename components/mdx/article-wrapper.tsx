"use client";

import { useEffect } from "react";

/**
 * ArticleWrapper — 포스트 본문의 첫 번째 문단에 drop cap 스타일 자동 적용
 */
export function ArticleWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Find the first <p> element in the article prose content
    const prose = document.querySelector(".prose");
    if (!prose) return;

    // Find the first paragraph that has substantial text content (not empty or just whitespace)
    const paragraphs = prose.querySelectorAll("p");
    let firstParagraph: HTMLParagraphElement | null = null;

    for (const p of paragraphs) {
      const text = p.textContent?.trim() || "";
      // Skip if paragraph is empty, too short, or only contains images/links
      if (text.length > 20 && !p.querySelector("img")) {
        firstParagraph = p as HTMLParagraphElement;
        break;
      }
    }

    if (firstParagraph && !firstParagraph.classList.contains("drop-cap")) {
      firstParagraph.classList.add("drop-cap");
    }
  }, []);

  return <>{children}</>;
}
