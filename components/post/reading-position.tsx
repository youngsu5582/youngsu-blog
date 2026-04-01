"use client";

import { useEffect, useState, useRef } from "react";
import { X, BookMarked } from "lucide-react";

interface ReadingPositionProps {
  slug: string;
}

const STORAGE_KEY_PREFIX = "reading-position-";
const COMPLETE_THRESHOLD = 95; // 95% 이상 스크롤 시 읽기 완료로 간주
const SAVE_THRESHOLD = 10; // 10% 이상 읽었을 때부터 저장
const BANNER_AUTO_DISMISS_MS = 5000;

export function ReadingPosition({ slug }: ReadingPositionProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [savedPosition, setSavedPosition] = useState<number | null>(null);
  const bannerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasRestoredRef = useRef(false);

  // 페이지 로드 시 저장된 위치 확인
  useEffect(() => {
    const key = `${STORAGE_KEY_PREFIX}${slug}`;
    const saved = localStorage.getItem(key);

    if (saved) {
      const position = parseFloat(saved);
      if (position > SAVE_THRESHOLD && position < COMPLETE_THRESHOLD) {
        setSavedPosition(position);
        setShowBanner(true);

        // 5초 후 자동 숨김
        bannerTimeoutRef.current = setTimeout(() => {
          setShowBanner(false);
        }, BANNER_AUTO_DISMISS_MS);
      }
    }

    return () => {
      if (bannerTimeoutRef.current) {
        clearTimeout(bannerTimeoutRef.current);
      }
    };
  }, [slug]);

  // 스크롤 이벤트: 위치 저장 및 완료 감지
  useEffect(() => {
    const handleScroll = () => {
      const el = document.documentElement;
      const scrollTop = el.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

      const key = `${STORAGE_KEY_PREFIX}${slug}`;

      // 읽기 완료: 저장된 위치 삭제
      if (pct >= COMPLETE_THRESHOLD) {
        localStorage.removeItem(key);
        setShowBanner(false);
        return;
      }

      // 일정 비율 이상 읽었을 때만 저장
      if (pct >= SAVE_THRESHOLD) {
        localStorage.setItem(key, pct.toFixed(2));
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [slug]);

  // 이어서 읽기 버튼 클릭
  const handleResumeReading = () => {
    if (savedPosition === null) return;

    const el = document.documentElement;
    const scrollHeight = el.scrollHeight - el.clientHeight;
    const targetScrollTop = (savedPosition / 100) * scrollHeight;

    window.scrollTo({
      top: targetScrollTop,
      behavior: "smooth",
    });

    setShowBanner(false);
    hasRestoredRef.current = true;

    if (bannerTimeoutRef.current) {
      clearTimeout(bannerTimeoutRef.current);
    }
  };

  // 배너 닫기
  const handleDismiss = () => {
    setShowBanner(false);
    if (bannerTimeoutRef.current) {
      clearTimeout(bannerTimeoutRef.current);
    }
  };

  if (!showBanner || savedPosition === null) return null;

  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm animate-in slide-in-from-right duration-300">
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-4 flex items-start gap-3">
        <BookMarked className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground mb-2">
            이전에 읽던 위치가 있습니다
          </p>
          <button
            onClick={handleResumeReading}
            className="text-sm font-medium text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
          >
            이어서 읽기 ({Math.round(savedPosition)}%)
          </button>
        </div>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          aria-label="배너 닫기"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
