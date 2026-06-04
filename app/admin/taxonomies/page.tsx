"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCcw, Tags } from "lucide-react";

type TaxonomyField = "tags" | "categories";

interface TaxonomyUsageItem {
  value: string;
  count: number;
  files: Array<{ repoPath: string; title: string }>;
}

export default function AdminTaxonomiesPage() {
  const [field, setField] = useState<TaxonomyField>("tags");
  const [items, setItems] = useState<TaxonomyUsageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [message, setMessage] = useState("");

  const loadItems = async (nextField = field) => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/taxonomies?field=${nextField}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "분류 목록을 불러오지 못했습니다");
      setItems(data.items || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems(field);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return items;
    return items.filter((item) => item.value.toLowerCase().includes(normalizedQuery));
  }, [items, query]);

  const selectedUsage = useMemo(
    () => items.find((item) => item.value === fromValue.trim()),
    [items, fromValue]
  );

  const affectedFileCount = selectedUsage?.files.length || 0;

  const handleSelect = (value: string) => {
    setFromValue(value);
    setToValue(value);
    setMessage(`${value} 선택됨 · 새 이름을 입력하면 전체 ${field === "tags" ? "태그" : "카테고리"}를 일괄 변경합니다.`);
  };

  const handleRename = async () => {
    if (!fromValue.trim() || !toValue.trim()) {
      setMessage("바꿀 값과 새 값을 모두 입력해주세요.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/taxonomies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, from: fromValue, to: toValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "일괄 변경에 실패했습니다");
      setMessage(`변경 완료: ${data.updatedFiles.length}개 파일 수정됨`);
      setFromValue("");
      setToValue("");
      await loadItems(field);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl space-y-6">
      <section className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Tags className="h-5 w-5" />
              <h2 className="text-lg font-semibold">태그/카테고리 관리</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              오타 태그를 rename하거나 같은 의미의 태그를 병합합니다. 기존 순서는 유지하고 중복은 제거합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadItems(field)}
            disabled={loading || saving}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium hover:bg-accent disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
            새로고침
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-md border p-1">
            <button
              type="button"
              onClick={() => setField("tags")}
              className={`rounded px-3 py-1.5 text-xs font-medium ${field === "tags" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              태그
            </button>
            <button
              type="button"
              onClick={() => setField("categories")}
              className={`rounded px-3 py-1.5 text-xs font-medium ${field === "categories" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              카테고리
            </button>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="검색..."
            className="min-w-56 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <span className="text-xs text-muted-foreground">전체 {items.length}개 · 표시 {filteredItems.length}개</span>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">사용 목록</h3>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <div className="max-h-[620px] space-y-2 overflow-y-auto pr-1">
            {filteredItems.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => handleSelect(item.value)}
                className="w-full rounded-md border p-3 text-left transition-colors hover:bg-accent"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{item.value}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{item.count}개</span>
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {item.files.slice(0, 3).map((file) => file.title).join(" · ")}
                  {item.files.length > 3 ? ` 외 ${item.files.length - 3}개` : ""}
                </p>
              </button>
            ))}
            {!loading && filteredItems.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">표시할 항목이 없습니다.</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-4">
          <div>
            <h3 className="text-sm font-semibold">Rename / Merge</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              새 값이 이미 존재하면 두 값을 병합합니다. 예: home-lab → homelab
            </p>
          </div>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">기존 값</span>
            <input
              value={fromValue}
              onChange={(e) => setFromValue(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">새 값</span>
            <input
              value={toValue}
              onChange={(e) => setToValue(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </label>
          {selectedUsage && (
            <section
              role="region"
              aria-label="변경 영향 미리보기"
              className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3 space-y-2"
            >
              <div>
                <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                  적용 전 영향 파일 {affectedFileCount}개
                </h4>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  아래 파일의 {field === "tags" ? "태그" : "카테고리"} 값이 바뀝니다. 새 값이 이미 있으면 병합되고 중복은 제거됩니다.
                </p>
              </div>
              <ul className="max-h-40 space-y-1 overflow-y-auto text-xs">
                {selectedUsage.files.map((file) => (
                  <li key={file.repoPath} className="rounded border bg-background/70 p-2">
                    <div className="font-medium text-foreground">{file.title}</div>
                    <div className="mt-0.5 break-all text-[10px] text-muted-foreground">{file.repoPath}</div>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <button
            type="button"
            onClick={handleRename}
            disabled={saving || loading || !fromValue.trim() || !toValue.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {affectedFileCount > 0 ? `${affectedFileCount}개 파일에 적용` : "전체 파일에 적용"}
          </button>
          {message && (
            <p className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground" role="status">
              {message}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
