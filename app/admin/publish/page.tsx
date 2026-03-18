"use client";

import { useState, useEffect } from "react";
import { GitPullRequest, Loader2, Check, AlertCircle } from "lucide-react";

interface GitStatus {
  modified: string[];
  added: string[];
  deleted: string[];
  untracked: string[];
}

export default function PublishPage() {
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/git/status")
      .then((r) => r.json())
      .then((data) => { setStatus(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">발행</h2>
        <p className="text-sm text-muted-foreground mt-1">
          변경사항을 확인하고 커밋 + PR을 생성합니다
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : status && (status.modified.length + status.added.length + status.deleted.length + status.untracked.length) > 0 ? (
        <div className="space-y-4">
          {/* Changed files */}
          <div className="rounded-lg border border-border/60 p-4">
            <h3 className="text-sm font-semibold mb-3">변경된 파일</h3>
            <div className="space-y-1">
              {status.modified.map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs py-1">
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono">M</span>
                  <span className="text-muted-foreground">{f}</span>
                </div>
              ))}
              {status.added.map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs py-1">
                  <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400 font-mono">A</span>
                  <span className="text-muted-foreground">{f}</span>
                </div>
              ))}
              {status.untracked.map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs py-1">
                  <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono">?</span>
                  <span className="text-muted-foreground">{f}</span>
                </div>
              ))}
              {status.deleted.map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs py-1">
                  <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 font-mono">D</span>
                  <span className="text-muted-foreground">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            AI 리뷰 + 커밋 + PR 기능은 API 키 설정 후 활성화됩니다.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-lg">
          <div className="p-3 rounded-full bg-green-500/10 mb-4">
            <Check className="h-6 w-6 text-green-500" />
          </div>
          <p className="text-sm font-medium">변경사항이 없습니다</p>
          <p className="text-xs text-muted-foreground mt-1">모든 파일이 최신 상태입니다</p>
        </div>
      )}
    </div>
  );
}
