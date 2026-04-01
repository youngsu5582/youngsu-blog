"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home, RefreshCw, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(true); // 관리자 페이지에서는 기본적으로 상세 정보 표시

  useEffect(() => {
    // 에러를 콘솔에 기록
    console.error("Admin error boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-2xl">
        <div className="space-y-3">
          <div className="flex items-center justify-center">
            <AlertTriangle className="h-16 w-16 text-destructive/60" />
          </div>
          <h1 className="text-3xl font-bold">관리 페이지 오류</h1>
          <p className="text-sm text-muted-foreground">
            관리 페이지에서 오류가 발생했습니다.
            <br />
            문제가 지속되면 개발자 도구의 콘솔을 확인해 주세요.
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
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            <Home className="h-4 w-4" />
            대시보드로
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            홈으로
          </Link>
        </div>

        {/* 관리자용 에러 상세 정보 (기본 표시) */}
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
            <div className="mt-4 p-4 rounded-lg bg-muted/50 text-left space-y-3 border border-destructive/20">
              <div className="text-xs">
                <span className="font-semibold text-destructive">Error Message:</span>
                <p className="mt-1 font-mono text-[11px] text-foreground break-all bg-background p-2 rounded">
                  {error.message}
                </p>
              </div>
              {error.digest && (
                <div className="text-xs">
                  <span className="font-semibold">Digest:</span>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground bg-background p-2 rounded">
                    {error.digest}
                  </p>
                </div>
              )}
              {error.stack && (
                <div className="text-xs">
                  <span className="font-semibold">Stack Trace:</span>
                  <pre className="mt-1 font-mono text-[10px] text-muted-foreground overflow-x-auto whitespace-pre-wrap max-h-60 overflow-y-auto bg-background p-3 rounded border border-border">
                    {error.stack}
                  </pre>
                </div>
              )}
              <div className="pt-2 text-[11px] text-muted-foreground">
                <p>💡 Tip: F12를 눌러 개발자 도구의 Console 탭에서 추가 로그를 확인할 수 있습니다.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
