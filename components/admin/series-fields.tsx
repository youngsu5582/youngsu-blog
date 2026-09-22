"use client";

import { useMemo } from "react";
import type { AdminSeriesOption, SeriesStatus } from "@/lib/admin-series";

export type SeriesMode = "none" | "existing" | "new";

export interface SeriesFormValue {
  series: string;
  seriesOrder: string;
  seriesDescription: string;
  seriesStatus: SeriesStatus;
}

interface SeriesFieldsProps {
  mode: SeriesMode;
  value: SeriesFormValue;
  options: AdminSeriesOption[];
  currentSlug?: string;
  disabled?: boolean;
  onModeChange: (mode: SeriesMode) => void;
  onChange: (value: SeriesFormValue) => void;
}

const EMPTY_VALUE: SeriesFormValue = {
  series: "",
  seriesOrder: "",
  seriesDescription: "",
  seriesStatus: "ongoing",
};

export function SeriesFields({
  mode,
  value,
  options,
  currentSlug,
  disabled = false,
  onModeChange,
  onChange,
}: SeriesFieldsProps) {
  const selectedOption = useMemo(
    () => options.find((option) => option.name === value.series),
    [options, value.series],
  );
  const order = Number(value.seriesOrder);
  const duplicateOrder = Boolean(
    selectedOption &&
    Number.isInteger(order) &&
    order > 0 &&
    selectedOption.posts.some((post) => post.slug !== currentSlug && post.order === order),
  );

  const setValue = (patch: Partial<SeriesFormValue>) => onChange({ ...value, ...patch });

  const handleModeChange = (nextMode: SeriesMode) => {
    onModeChange(nextMode);
    if (nextMode === "none") {
      onChange(EMPTY_VALUE);
      return;
    }
    if (nextMode === "new") {
      onChange({ ...EMPTY_VALUE });
      return;
    }
    const firstOption = options[0];
    if (firstOption) {
      onChange({
        series: firstOption.name,
        seriesOrder: String(firstOption.nextOrder),
        seriesDescription: firstOption.description ?? "",
        seriesStatus: firstOption.status,
      });
    }
  };

  return (
    <section
      className="space-y-3 rounded-lg border border-border/60 bg-muted/10 p-3"
      aria-label="시리즈로 작성하기"
    >
      <div>
        <h3 className="text-sm font-semibold">시리즈로 작성하기</h3>
        <p className="mt-1 text-[11px] text-muted-foreground">
          관련 포스트와 달리, 독자가 읽을 순서가 있는 본편만 시리즈에 넣어요.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {(
          [
            ["none", "시리즈 없음"],
            ["existing", "기존 시리즈 선택"],
            ["new", "새 시리즈 만들기"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            disabled={disabled}
            onClick={() => handleModeChange(id)}
            className={`rounded-md border px-3 py-2 text-xs transition-colors ${
              mode === id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {label}
          </button>
        ))}
      </div>

      {disabled && (
        <p className="text-[11px] text-muted-foreground">
          시리즈 메타데이터는 현재 포스트에서만 사용할 수 있어요.
        </p>
      )}

      {!disabled && mode === "existing" && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="series-existing">
            시리즈
          </label>
          <select
            id="series-existing"
            value={value.series}
            onChange={(event) => {
              const option = options.find((item) => item.name === event.target.value);
              setValue({
                series: event.target.value,
                seriesOrder: String(option?.nextOrder ?? 1),
                seriesDescription: option?.description ?? "",
                seriesStatus: option?.status ?? "ongoing",
              });
            }}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {value.series && !selectedOption && (
              <option value={value.series}>{value.series} (현재 값)</option>
            )}
            {options.length === 0 && <option value="">아직 생성된 시리즈가 없습니다</option>}
            {options.map((option) => (
              <option key={option.name} value={option.name}>
                {option.name} · {option.posts.length}편
              </option>
            ))}
          </select>
        </div>
      )}

      {!disabled && mode === "new" && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="series-name">
            새 시리즈 이름
          </label>
          <input
            id="series-name"
            value={value.series}
            onChange={(event) => setValue({ series: event.target.value })}
            placeholder="예: 결제 콜백 안정성"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      )}

      {!disabled && mode !== "none" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="series-order">
              시리즈 순서
            </label>
            <input
              id="series-order"
              type="number"
              min={1}
              step={1}
              value={value.seriesOrder}
              onChange={(event) => setValue({ seriesOrder: event.target.value })}
              placeholder="1"
              className={`w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${duplicateOrder ? "border-amber-500" : "border-border"}`}
            />
            {duplicateOrder ? (
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                같은 시리즈에 같은 순서가 이미 있어요.
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                기존 시리즈는 다음 순서를 자동 제안해요.
              </p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="series-status">
              시리즈 상태
            </label>
            <select
              id="series-status"
              value={value.seriesStatus}
              onChange={(event) => setValue({ seriesStatus: event.target.value as SeriesStatus })}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="ongoing">연재 중</option>
              <option value="completed">완결</option>
            </select>
          </div>
        </div>
      )}

      {!disabled && mode !== "none" && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="series-description">
            시리즈 설명
          </label>
          <textarea
            id="series-description"
            value={value.seriesDescription}
            onChange={(event) => setValue({ seriesDescription: event.target.value })}
            rows={2}
            placeholder="이 시리즈가 어떤 문제를 어떤 순서로 다루는지 짧게 적어주세요."
            className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      )}
    </section>
  );
}
