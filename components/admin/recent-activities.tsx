"use client";

import { useEffect, useState } from "react";
import { History, FileText } from "lucide-react";

interface GitLogEntry {
  hash: string;
  message: string;
  timestamp: string;
  relativeTime: string;
  files: string[];
}

export default function RecentActivities() {
  const [commits, setCommits] = useState<GitLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActivities() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/git/log?limit=10&path=content/");
        const data = await res.json();

        if (data.success) {
          setCommits(data.commits);
        } else {
          setError(data.error || "활동 내역을 불러오지 못했습니다");
        }
      } catch (err) {
        setError("활동 내역 로드 중 오류가 발생했습니다");
        console.error("Failed to fetch git log:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, []);

  return (
    <div className="rounded-lg border border-border/60 p-4">
      <div className="flex items-center gap-2 mb-3">
        <History className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">최근 활동</h3>
      </div>

      {loading && (
        <div className="text-xs text-muted-foreground text-center py-4">로딩 중...</div>
      )}

      {error && (
        <div className="text-xs text-red-500 text-center py-4">{error}</div>
      )}

      {!loading && !error && commits.length === 0 && (
        <div className="text-xs text-muted-foreground text-center py-4">
          최근 콘텐츠 변경 내역이 없습니다
        </div>
      )}

      {!loading && !error && commits.length > 0 && (
        <div className="space-y-3">
          {commits.map((commit) => (
            <div
              key={commit.hash}
              className="border-b border-border/30 last:border-0 pb-3 last:pb-0"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm font-medium text-foreground flex-1">
                  {commit.message}
                </p>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {commit.relativeTime}
                </span>
              </div>

              {commit.files.length > 0 && (
                <div className="space-y-1 mt-2">
                  {commit.files.slice(0, 3).map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground"
                    >
                      <FileText className="h-3 w-3" />
                      <span className="truncate">{file.replace(/^content\//, "")}</span>
                    </div>
                  ))}
                  {commit.files.length > 3 && (
                    <p className="text-xs text-muted-foreground/50 pl-4">
                      +{commit.files.length - 3}개 더
                    </p>
                  )}
                </div>
              )}

              <div className="mt-2">
                <code className="text-xs text-muted-foreground/70 font-mono">
                  {commit.hash.substring(0, 7)}
                </code>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
