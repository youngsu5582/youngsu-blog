"use client";

import { useEffect, useState, useRef } from "react";
import { trackReadComplete } from "@/lib/analytics";

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  const tracked = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      const el = document.documentElement;
      const scrollTop = el.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      setProgress(pct);

      // 75% 도달 시 읽기 완료 이벤트 (1회만)
      if (pct >= 75 && !tracked.current) {
        tracked.current = true;
        const slug = window.location.pathname.replace("/posts/", "");
        const title = document.title;
        trackReadComplete(slug, title);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (progress <= 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-[3px]">
      <div
        className="h-full bg-gradient-to-r from-primary to-primary/70 transition-[width] duration-100 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
