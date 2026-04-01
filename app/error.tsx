"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // 에러를 콘솔에 기록
    console.error("Global error boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-lg">
        <div className="space-y-3">
          <h1 className="text-6xl font-bold text-muted-foreground/30">오류</h1>
          <h2 className="text-2xl font-semibold">문제가 발생했습니다</h2>
          <p className="text-sm text-muted-foreground">
            페이지를 불러오는 중에 예상치 못한 오류가 발생했습니다.
            <br />
            잠시 후 다시 시도해 주세요.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            다시 시도
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            <Home className="h-4 w-4" />
            홈으로
          </Link>
        </div>

        {/* 디버깅을 위한 에러 상세 정보 토글 */}
        <div className="pt-6 border-t border-border">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showDetails ? (
              <>
                <ChevronUp className="h-3 w-3" />
                상세 정보 숨기기
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                상세 정보 보기
              </>
            )}
          </button>

          {showDetails && (
            <div className="mt-4 p-4 rounded-lg bg-muted/50 text-left space-y-2">
              <div className="text-xs">
                <span className="font-semibold text-destructive">Error:</span>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground break-all">
                  {error.message}
                </p>
              </div>
              {error.digest && (
                <div className="text-xs">
                  <span className="font-semibold">Digest:</span>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    {error.digest}
                  </p>
                </div>
              )}
              {error.stack && (
                <div className="text-xs">
                  <span className="font-semibold">Stack:</span>
                  <pre className="mt-1 font-mono text-[10px] text-muted-foreground overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
